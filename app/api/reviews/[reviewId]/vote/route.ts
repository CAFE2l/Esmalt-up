import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ reviewId: string }> },
) {
  try {
    const { reviewId } = await params;
    const auth = await authenticateRequest(req);
    const sessionId = (await req.json().catch(() => null))?.sessionId as
      | string
      | undefined;

    if (!auth.ok && (!sessionId || sessionId.length < 1)) {
      return NextResponse.json(
        { error: "Identifique-se para marcar como útil." },
        { status: 401 },
      );
    }

    const existing = await prisma.reviewVote.findFirst({
      where: {
        reviewId,
        userId: auth.ok ? auth.uid : undefined,
        sessionId: auth.ok ? undefined : sessionId,
      },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.reviewVote.delete({ where: { id: existing.id } }),
        prisma.review.update({
          where: { id: reviewId },
          data: { helpfulCount: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ helpful: false, delta: -1 });
    }

    await prisma.$transaction([
      prisma.reviewVote.create({
        data: {
          reviewId,
          userId: auth.ok ? auth.uid : null,
          sessionId: auth.ok ? null : sessionId,
        },
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ helpful: true, delta: 1 });
  } catch (error) {
    console.error("[api/reviews/vote] POST", error);
    return NextResponse.json(
      { error: "Não foi possível registrar o voto." },
      { status: 500 },
    );
  }
}