import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/authUtils";
import { prisma } from "@/lib/prisma";
import { ensureProductRecord } from "@/lib/products";

export const runtime = "nodejs";

const favoriteSchema = z.object({
  productId: z.string().trim().min(1).max(200),
});

async function findProduct(identifier: string) {
  return ensureProductRecord(identifier);
}

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: auth.uid },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        productId: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            slug: true,
            kind: true,
            name: true,
            description: true,
            priceCents: true,
            category: true,
            stock: true,
            images: true,
            featured: true,
          },
        },
      },
    });
    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("[api/favorites] GET", error);
    return NextResponse.json(
      { error: "Não foi possível carregar sua lista de desejos." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const parsed = favoriteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Produto inválido." }, { status: 400 });
  }

  try {
    const product = await findProduct(parsed.data.productId);
    if (!product) {
      return NextResponse.json({ error: "Este produto não está disponível." }, { status: 404 });
    }

    await prisma.userProfile.upsert({
      where: { uid: auth.uid },
      create: { uid: auth.uid, interests: [], badges: [] },
      update: {},
      select: { uid: true },
    });

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_productId: { userId: auth.uid, productId: product.id },
      },
      create: { userId: auth.uid, productId: product.id },
      update: {},
      select: {
        id: true,
        productId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ favorite: { ...favorite, product } }, { status: 201 });
  } catch (error) {
    console.error("[api/favorites] POST", error);
    return NextResponse.json(
      { error: "Não foi possível salvar este favorito." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const parsed = favoriteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Produto inválido." }, { status: 400 });
  }

  try {
    const product = await findProduct(parsed.data.productId);
    if (!product) {
      return NextResponse.json({ error: "Este produto não está disponível." }, { status: 404 });
    }
    await prisma.favorite.deleteMany({
      where: { userId: auth.uid, productId: product.id },
    });
    return NextResponse.json({ productId: product.id });
  } catch (error) {
    console.error("[api/favorites] DELETE", error);
    return NextResponse.json(
      { error: "Não foi possível remover este favorito." },
      { status: 500 },
    );
  }
}
