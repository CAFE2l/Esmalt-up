import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";
import { getProduct } from "@/lib/catalogData";
import {
  findBuiltInCoupon,
  couponDiscountCents,
  normalizeCouponCode,
} from "@/lib/coupons";
import { calculateFreight } from "@/lib/shipping";
import { createPurchasePayment, isMpConfigured, type PaymentResult } from "@/lib/payments";
import { sendMail, buildOrderConfirmationEmail } from "@/lib/mail";

export const runtime = "nodejs";

const cardSchema = z.object({
  token: z.string().min(1),
  installments: z.number().int().min(1).max(12),
});

const checkoutSchema = z.object({
  sessionId: z.string().min(1).max(120).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1),
  customer: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    cpf: z.string().regex(/^\d{11}$/).optional(),
  }),
  address: z.object({
    cep: z.string().min(8).max(9),
    logradouro: z.string().min(2).max(160),
    numero: z.string().min(1).max(20),
    complemento: z.string().max(80).optional(),
    bairro: z.string().min(2).max(100),
    cidade: z.string().min(2).max(100),
    uf: z.string().length(2),
  }),
  couponCode: z.string().max(40).optional(),
  payment: z.object({
    method: z.enum(["pix", "boleto", "card"]),
    card: cardSchema.optional(),
  }),
});

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);

    const body = await req.json().catch(() => null);
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 },
      );
    }

    const { items, customer, address, couponCode, payment } = parsed.data;

    // ---- Valida itens contra o catálogo (fonte da verdade de preço). ----
    const lines = items
      .map((item) => {
        const product = getProduct(item.productId);
        if (!product) return null;
        return { ...item, product, cents: product.priceCents * item.quantity };
      })
      .filter((line) => line !== null);

    if (lines.length === 0) {
      return NextResponse.json(
        { error: "Nenhum produto válido no pedido." },
        { status: 400 },
      );
    }

    const productWithNoStock = lines.find(
      (line) => line.product.stockStatus !== "in_stock",
    );
    if (productWithNoStock) {
      return NextResponse.json(
        { error: `${productWithNoStock.product.name} está esgotado.` },
        { status: 409 },
      );
    }

    const subtotalCents = lines.reduce((sum, line) => sum + line.cents, 0);
    const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

    // ---- Cupom (banco primeiro, fallback embutido). ----
    let discountCents = 0;
    let resolvedCouponCode: string | null = null;
    if (couponCode) {
      const normalized = normalizeCouponCode(couponCode);
      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: normalized },
      });
      const coupon = dbCoupon
        ? {
            code: dbCoupon.code,
            type: (dbCoupon.type === "percent" ? "percent" : "fixed") as
              | "percent"
              | "fixed",
            value: dbCoupon.value,
            label: "",
          }
        : findBuiltInCoupon(normalized);

      if (coupon) {
        discountCents = couponDiscountCents(coupon, subtotalCents);
        resolvedCouponCode = normalized;
      }
    }

    const freight = calculateFreight({ subtotalCents, itemCount });
    const totalCents = subtotalCents - discountCents + freight.cents;

    // ---- Persiste pedido. ----
    const primary = lines[0]!.product;
    const kitName =
      lines.length === 1 && lines[0]!.quantity === 1
        ? primary.name
        : `${primary.name} +${lines.length - 1} ${lines.length - 1 === 1 ? "item" : "itens"}`;

    const order = await prisma.order.create({
      data: {
        userId: auth.ok ? auth.uid : null,
        sessionId: parsed.data.sessionId ?? null,
        customerName: customer.name,
        email: customer.email,
        kitName,
        status: "aguardando_pagamento",
        subtotalCents,
        shippingCents: freight.cents,
        discountCents,
        totalCents,
        couponCode: resolvedCouponCode,
        cep: address.cep,
        address: [address.logradouro, address.numero, address.complemento]
          .filter(Boolean)
          .join(", "),
        neighborhood: address.bairro,
        city: address.cidade,
        state: address.uf,
        paymentMethod: payment.method,
        paymentStatus: "pending",
        items: {
          create: lines.map((line) => ({
            productId: line.product.id,
            productName: line.product.name,
            priceCents: line.product.priceCents,
            quantity: line.quantity,
          })),
        },
      },
    });

    // ---- Cria cobrança (Mercado Pago real ou modo demonstração). ----
    let instructions: PaymentResult;
    try {
      instructions = await createPurchasePayment({
        kind: payment.method,
        orderId: order.id,
        description: `Esmalt'up — ${kitName}`,
        amount: totalCents / 100,
        email: customer.email,
        name: customer.name,
        cpf: customer.cpf,
        card:
          payment.method === "card"
            ? {
                token: payment.card!.token,
                installments: payment.card!.installments,
              }
            : undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar o pagamento.";
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "falha_pagamento", paymentStatus: "failed" },
      });
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const paidImmediately = instructions.status === "approved";

    await prisma.order.update({
      where: { id: order.id },
      data: {
        gatewayPaymentId: instructions.gatewayPaymentId,
        gatewayStatus: instructions.status,
        paymentStatus: paidImmediately ? "paid" : "pending",
        status: paidImmediately ? "pago" : "aguardando_pagamento",
        paymentExtra: JSON.stringify({
          mode: instructions.mode,
          message: instructions.message,
          ...(instructions.mode === "demo"
            ? { demo: true, confirmAfterMs: 8000 }
            : {}),
        }),
      },
    });

    // Notificação por e-mail (no-op em dev sem SMTP).
    await sendMail(
      buildOrderConfirmationEmail({
        to: customer.email,
        orderId: order.id,
        productLabel: kitName,
        total: (totalCents / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
      }),
    );

    return NextResponse.json(
      {
        orderId: order.id,
        totalCents,
        discounts: { subtotalCents, discountCents, shippingCents: freight.cents },
        gateway: instructions.mode,
        demo: instructions.mode === "demo",
        instructions: {
          kind: instructions.kind,
          status: instructions.status,
          qrBase64: instructions.qrBase64,
          copyPaste: instructions.copyPaste,
          boletoUrl: instructions.boletoUrl,
          digitableLine: instructions.digitableLine,
          boletoDueDate: instructions.boletoDueDate,
          message: instructions.message,
        },
        isMpConfigured: isMpConfigured(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/checkout] POST", error);
    return NextResponse.json(
      { error: "Não foi possível processar o pedido." },
      { status: 500 },
    );
  }
}