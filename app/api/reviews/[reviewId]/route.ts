import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { authenticateRequest } from "@/lib/authUtils";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const updateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  content: z.string().trim().min(10).max(2000),
});

async function recalculateRating(tx: Prisma.TransactionClient, productId: string) {
  const aggregate = await tx.review.aggregate({
    where: { productId, status: "approved" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await tx.product.update({
    where: { id: productId },
    data: {
      ratingAvg: aggregate._avg.rating ?? 0,
      ratingCount: aggregate._count._all,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Entre em sua conta para editar a avaliação." }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
      { status: 400 },
    );
  }

  const { reviewId } = await params;
  try {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, userId: auth.uid },
      select: { productId: true },
    });
    if (!review) {
      return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.review.update({
        where: { id: reviewId },
        data: parsed.data,
      });
      await recalculateRating(tx, review.productId);
      return item;
    });
    return NextResponse.json({ review: updated });
  } catch (error) {
    console.error("[api/reviews/:reviewId] PATCH", error);
    return NextResponse.json({ error: "Não foi possível editar a avaliação." }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Entre em sua conta para excluir a avaliação." }, { status: 401 });
  }

  const { reviewId } = await params;
  try {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, userId: auth.uid },
      select: { productId: true },
    });
    if (!review) {
      return NextResponse.json({ error: "Avaliação não encontrada." }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await recalculateRating(tx, review.productId);
    });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[api/reviews/:reviewId] DELETE", error);
    return NextResponse.json({ error: "Não foi possível excluir a avaliação." }, { status: 500 });
  }
}
