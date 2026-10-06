import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";

export const runtime = "nodejs";

/** Status em que o cliente ainda pode cancelar o próprio pedido. */
const CANCELABLE_STATUSES = new Set(["aguardando_pagamento", "pago"]);

function serializeOrder(order: {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  kitName: string;
  createdAt: Date;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  couponCode: string | null;
  trackingCode: string | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  customerName: string | null;
  email: string | null;
  address: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    uf: string;
  } | null;
  items: { productId: string; productName: string; quantity: number; priceCents: number; variant: string | null }[];
}) {
  return {
    id: order.id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    kitName: order.kitName,
    createdAt: order.createdAt,
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    discountCents: order.discountCents,
    totalCents: order.totalCents,
    couponCode: order.couponCode,
    trackingCode: order.trackingCode,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    customerName: order.customerName,
    email: order.email,
    address: order.address,
    items: order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      priceCents: item.priceCents,
      variant: item.variant,
    })),
  };
}

/** GET /api/orders/[id] — detalhe completo do pedido do usuário autenticado. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { id } = await params;

  try {
    const order = await prisma.order.findFirst({
      where: { id, userId: auth.uid },
      include: { items: true, address: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 },
      );
    }

    return NextResponse.json({ order: serializeOrder(order) });
  } catch (error) {
    console.error("[api/orders/[id]] GET", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o pedido." },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/orders/[id] — ações do cliente sobre o pedido.
 * Body: { action: "cancel" }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { id } = await params;

  let action: string | undefined;
  try {
    const body = (await req.json()) as { action?: string };
    action = body.action;
  } catch {
    action = undefined;
  }

  if (action !== "cancel") {
    return NextResponse.json(
      { error: "Ação inválida." },
      { status: 400 },
    );
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id, userId: auth.uid },
      select: { id: true, status: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 },
      );
    }

    if (!CANCELABLE_STATUSES.has(order.status)) {
      return NextResponse.json(
        { error: "Este pedido não pode mais ser cancelado." },
        { status: 409 },
      );
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "cancelado" },
      select: { id: true, status: true },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("[api/orders/[id]] PATCH", error);
    return NextResponse.json(
      { error: "Não foi possível cancelar o pedido." },
      { status: 500 },
    );
  }
}
