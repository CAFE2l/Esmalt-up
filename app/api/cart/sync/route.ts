import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";
import { getProduct, getPrimaryProductImage } from "@/lib/products";

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

    const validItems: typeof parsed.data.items = [];
    for (const item of parsed.data.items) {
      const product = await getProduct(item.productId);
      if (product && product.stock >= item.quantity) {
        validItems.push({ ...item, productId: product.id });
      }
    }

    await prisma.userProfile.upsert({
      where: { uid: auth.uid },
      create: { uid: auth.uid, interests: [], badges: [] },
      update: {},
      select: { uid: true },
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
    for (const [productId, quantity] of Array.from(merged.entries())) {
      const product = await getProduct(productId);
      if (!product || product.stock <= 0) {
        merged.delete(productId);
      } else {
        merged.set(productId, Math.min(quantity, product.stock, 99));
      }
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.cartItem.deleteMany({ where: { cartId: cart.id } });
      if (merged.size > 0) {
        await transaction.cartItem.createMany({
          data: Array.from(merged.entries()).map(([productId, quantity]) => ({
            cartId: cart.id,
            productId,
            quantity,
          })),
        });
      }
    });

    const items = await Promise.all(
      Array.from(merged.entries()).map(async ([productId, quantity]) => {
        const product = await getProduct(productId);
        return product
          ? {
              productId,
              quantity,
              product: {
                id: product.id,
                slug: product.slug,
                kind: product.kind,
                name: product.name,
                priceCents: product.priceCents,
                imageUrl: getPrimaryProductImage(product),
                stock: product.stock,
              },
            }
          : null;
      }),
    );

    return NextResponse.json({ items: items.filter((item) => item !== null) });
  } catch (error) {
    console.error("[api/cart/sync] POST", error);
    return NextResponse.json(
      { error: "Não foi possível sincronizar o carrinho." },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const parsed = syncSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const validItems: Array<{ productId: string; quantity: number }> = [];
    for (const item of parsed.data.items) {
      const product = await getProduct(item.productId);
      if (product && product.stock >= item.quantity) {
        validItems.push({ productId: product.id, quantity: item.quantity });
      }
    }

    await prisma.userProfile.upsert({
      where: { uid: auth.uid },
      create: { uid: auth.uid, interests: [], badges: [] },
      update: {},
      select: { uid: true },
    });

    const cart = await prisma.cart.upsert({
      where: { userId: auth.uid },
      create: { userId: auth.uid, sessionId: parsed.data.sessionId ?? null },
      update: {},
      select: { id: true },
    });

    await prisma.$transaction(async (transaction) => {
      await transaction.cartItem.deleteMany({ where: { cartId: cart.id } });
      if (validItems.length > 0) {
        await transaction.cartItem.createMany({
          data: validItems.map((item) => ({ ...item, cartId: cart.id })),
        });
      }
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("[api/cart/sync] PUT", error);
    return NextResponse.json(
      { error: "Não foi possível salvar seu carrinho." },
      { status: 500 },
    );
  }
}