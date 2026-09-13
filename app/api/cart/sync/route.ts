import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";
import { getProduct } from "@/lib/catalogData";

export const runtime = "nodejs";

const syncSchema = z.object({
  sessionId: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .default([]),
});

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = syncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos." },
        { status: 400 },
      );
    }

    const validItems = parsed.data.items.filter((item) => {
      const product = getProduct(item.productId);
      return product && product.stockStatus === "in_stock";
    });

    const cart = await prisma.cart.upsert({
      where: { userId: auth.uid },
      create: {
        userId: auth.uid,
        sessionId: parsed.data.sessionId || null,
      },
      update: {},
      include: { items: true },
    });

    // Junta o carrinho salvo com o carrinho local do dispositivo.
    const merged = new Map<string, number>();
    for (const item of cart.items) merged.set(item.productId, item.quantity);
    for (const item of validItems) {
      const current = merged.get(item.productId) ?? 0;
      merged.set(item.productId, Math.min(99, current + item.quantity));
    }

    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      prisma.cartItem.createMany({
        data: Array.from(merged.entries()).map(([productId, quantity]) => ({
          cartId: cart.id,
          productId,
          quantity,
        })),
      }),
    ]);

    const items = Array.from(merged.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api/cart/sync] POST", error);
    return NextResponse.json(
      { error: "Não foi possível sincronizar o carrinho." },
      { status: 500 },
    );
  }
}