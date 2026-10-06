import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";
import { ensureProductRecord, getPrimaryProductImage } from "@/lib/products";

export const runtime = "nodejs";

const syncSchema = z.object({
  sessionId: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1).optional(),
        variantName: z.string().max(120).optional(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .default([]),
});

function selectedVariant(product: NonNullable<Awaited<ReturnType<typeof ensureProductRecord>>>, variantId?: string) {
  if (!variantId) {
    return {
      variantId: undefined,
      variantName: undefined,
      priceCents: product.priceCents,
      stock: product.stock,
      imageUrl: getPrimaryProductImage(product),
    };
  }
  const variant = product.optionGroups
    ?.flatMap((group) => group.options)
    .find((option) => option.id === variantId);
  return variant
    ? {
        variantId: variant.id,
        variantName: variant.name,
        priceCents: variant.priceCents,
        stock: variant.stock,
        imageUrl: variant.imageUrl ?? getPrimaryProductImage(product),
      }
    : null;
}

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
      const product = await ensureProductRecord(item.productId);
      const variant = product ? selectedVariant(product, item.variantId) : null;
      if (product && variant && variant.stock >= item.quantity) {
        validItems.push({
          ...item,
          productId: product.id,
          variantId: variant.variantId,
          variantName: variant.variantName,
        });
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
    const merged = new Map<string, (typeof validItems)[number]>();
    const lineKey = (productId: string, variantId?: string) => `${productId}\u0000${variantId ?? ""}`;
    for (const item of cart.items) {
      const key = lineKey(item.productId, item.variantId ?? undefined);
      merged.set(key, {
        productId: item.productId,
        variantId: item.variantId ?? undefined,
        variantName: item.variantName ?? undefined,
        quantity: item.quantity,
      });
    }
    for (const item of validItems) {
      const key = lineKey(item.productId, item.variantId);
      const current = merged.get(key);
      merged.set(key, {
        ...item,
        quantity: Math.min(99, (current?.quantity ?? 0) + item.quantity),
      });
    }
    for (const [key, line] of Array.from(merged.entries())) {
      const product = await ensureProductRecord(line.productId);
      const variant = product ? selectedVariant(product, line.variantId) : null;
      if (!product || !variant || variant.stock <= 0) {
        merged.delete(key);
      } else {
        merged.set(key, {
          ...line,
          variantName: variant.variantName,
          quantity: Math.min(line.quantity, variant.stock, 99),
        });
      }
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.cartItem.deleteMany({ where: { cartId: cart.id } });
      if (merged.size > 0) {
        await transaction.cartItem.createMany({
          data: Array.from(merged.values()).map(({ productId, variantId, variantName, quantity }) => ({
            cartId: cart.id,
            productId,
            variantId,
            variantName,
            quantity,
          })),
        });
      }
    });

    const items = await Promise.all(
      Array.from(merged.values()).map(async (line) => {
        const product = await ensureProductRecord(line.productId);
        const variant = product ? selectedVariant(product, line.variantId) : null;
        return product && variant
          ? {
              productId: line.productId,
              variantId: variant.variantId,
              variantName: variant.variantName,
              quantity: line.quantity,
              product: {
                id: product.id,
                slug: product.slug,
                kind: product.kind,
                name: product.name,
                priceCents: variant.priceCents,
                imageUrl: variant.imageUrl,
                stock: variant.stock,
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

    const validItems: Array<{
      productId: string;
      variantId?: string;
      variantName?: string;
      quantity: number;
    }> = [];
    for (const item of parsed.data.items) {
      const product = await ensureProductRecord(item.productId);
      const variant = product ? selectedVariant(product, item.variantId) : null;
      if (product && variant && variant.stock >= item.quantity) {
        validItems.push({
          productId: product.id,
          variantId: variant.variantId,
          variantName: variant.variantName,
          quantity: item.quantity,
        });
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