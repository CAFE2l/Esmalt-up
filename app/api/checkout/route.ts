import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";
import { ensureProductRecord } from "@/lib/products";
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
        variantId: z.string().min(1).optional(),
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
  }).superRefine((payment, context) => {
    if (payment.method === "card" && !payment.card) {
      context.addIssue({
        code: "custom",
        path: ["card"],
        message: "Informe os dados do cartão.",
      });
    }
  }),
});

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

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
    const lines: Array<{
      item: typeof items[number];
      product: NonNullable<Awaited<ReturnType<typeof ensureProductRecord>>>;
      cents: number;
      unitPriceCents: number;
      variantName: string | null;
      stock: number;
    }> = [];
    for (const item of items) {
      const product = await ensureProductRecord(item.productId);
      if (!product) continue;
      const variant = item.variantId
        ? product.optionGroups?.flatMap((group) => group.options).find((option) => option.id === item.variantId)
        : null;
      if (item.variantId && !variant) {
        return NextResponse.json({ error: `A opção selecionada para ${product.name} não está mais disponível.` }, { status: 409 });
      }
      const unitPriceCents = variant?.priceCents ?? product.priceCents;
      lines.push({
        item,
        product,
        cents: unitPriceCents * item.quantity,
        unitPriceCents,
        variantName: variant?.name ?? null,
        stock: variant?.stock ?? product.stock,
      });
    }

    if (lines.length === 0) {
      return NextResponse.json(
        { error: "Nenhum produto válido no pedido." },
        { status: 400 },
      );
    }

    const invalidStockLine = lines.find(
      (line) => line.stock < line.item.quantity,
    );
    if (invalidStockLine) {
      return NextResponse.json(
        { error: `${invalidStockLine.product.name} não tem estoque suficiente.` },
        { status: 409 },
      );
    }

    const subtotalCents = lines.reduce((sum, line) => sum + line.cents, 0);
    const itemCount = lines.reduce((sum, line) => sum + line.item.quantity, 0);

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
    await prisma.userProfile.upsert({
      where: { uid: auth.uid },
      create: { uid: auth.uid, interests: [], badges: [] },
      update: {},
      select: { uid: true },
    });

    const primary = lines[0]!.product;
    const kitName =
      lines.length === 1 && lines[0]!.item.quantity === 1
        ? primary.name
        : `${primary.name} +${lines.length - 1} ${lines.length - 1 === 1 ? "item" : "itens"}`;

    const order = await prisma.$transaction(async (transaction) => {
      const savedAddress = await transaction.address.create({
        data: {
          userId: auth.uid,
          cep: address.cep,
          logradouro: address.logradouro,
          numero: address.numero,
          complemento: address.complemento,
          bairro: address.bairro,
          cidade: address.cidade,
          uf: address.uf,
        },
      });

      return transaction.order.create({
        data: {
          userId: auth.uid,
          addressId: savedAddress.id,
          sessionId: parsed.data.sessionId ?? null,
          customerName: customer.name,
          email: customer.email,
          cpf: customer.cpf,
          kitName,
          status: "aguardando_pagamento",
          subtotalCents,
          shippingCents: freight.cents,
          discountCents,
          totalCents,
          couponCode: resolvedCouponCode,
          paymentMethod: payment.method,
          paymentStatus: "pending",
          items: {
            create: lines.map((line) => ({
              productId: line.product.id,
              productName: line.product.name,
              priceCents: line.unitPriceCents,
              quantity: line.item.quantity,
              variant: line.variantName,
            })),
          },
        },
      });
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
    const paymentRejected = instructions.status === "rejected";

    await prisma.order.update({
      where: { id: order.id },
      data: {
        gatewayPaymentId: instructions.gatewayPaymentId,
        gatewayStatus: instructions.status,
        paymentStatus: paidImmediately ? "paid" : paymentRejected ? "failed" : "pending",
        status: paidImmediately ? "pago" : paymentRejected ? "falha_pagamento" : "aguardando_pagamento",
        paymentExtra: JSON.stringify({
          mode: instructions.mode,
          message: instructions.message,
          ...(instructions.mode === "demo"
            ? { demo: true, confirmAfterMs: 8000 }
            : {}),
        }),
      },
    });

    let cartClearError: string | null = null;
    if (!paymentRejected) {
      try {
        const cart = await prisma.cart.findUnique({
          where: { userId: auth.uid },
          select: { id: true },
        });
        if (cart) {
          await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
      } catch (error) {
        console.error("[api/checkout] cart clear", error);
        cartClearError = "Pedido criado, mas não foi possível limpar o carrinho salvo. Atualize o carrinho antes da próxima compra.";
      }
    }

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
        cartClearError,
        orderUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin}/order/${order.id}?sessionId=${encodeURIComponent(parsed.data.sessionId ?? "")}`,
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