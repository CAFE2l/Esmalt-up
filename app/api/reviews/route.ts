import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";
import { ensureProductRecord } from "@/lib/products";

export const runtime = "nodejs";

const createSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  content: z.string().trim().min(10, "A avaliação deve ter pelo menos 10 caracteres.").max(2000),
  media: z
    .array(
      z.object({
        kind: z.enum(["image", "video"]),
        url: z.string().url(),
      }),
    )
    .max(3)
    .default([]),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const sort = searchParams.get("sort") ?? "recent";
    const sessionId = searchParams.get("sessionId");
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = 8;

    if (!productId) {
      return NextResponse.json(
        { error: "productId é obrigatório." },
        { status: 400 },
      );
    }

    // Identificação opcional para marcar "minha avaliação votada".
    const auth = await authenticateRequest(req);

    const allReviewsWhere = { productId, status: "approved" };
    const rating = Number(searchParams.get("rating"));
    const where = {
      ...allReviewsWhere,
      ...(Number.isInteger(rating) && rating >= 1 && rating <= 5 ? { rating } : {}),
      ...(sort === "with_media" ? { media: { some: {} } } : {}),
    };

    const [reviews, total, filteredTotal, grouped] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy:
          sort === "helpful"
            ? [{ helpfulCount: "desc" }, { createdAt: "desc" }]
            : sort === "rating"
              ? [{ rating: "desc" }, { createdAt: "desc" }]
              : sort === "low_rating"
                ? [{ rating: "asc" }, { createdAt: "desc" }]
                : { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          media: { orderBy: { sortOrder: "asc" } },
          votes: true,
        },
      }),
      prisma.review.count({ where: allReviewsWhere }),
      prisma.review.count({ where }),
      prisma.review.groupBy({
        by: ["rating"],
        where: allReviewsWhere,
        _count: { _all: true },
      }),
    ]);

    const distribution = Object.fromEntries(
      Array.from({ length: 5 }, (_, i) => [5 - i, 0]),
    );
    let sum = 0;
    for (const group of grouped) {
      distribution[group.rating] = group._count._all;
      sum += group.rating * group._count._all;
    }
    const average = total > 0 ? sum / total : null;

    return NextResponse.json({
      average,
      total,
      filteredTotal,
      distribution,
      items: reviews.map((review) => ({
        id: review.id,
        userName: review.userName,
        rating: review.rating,
        title: review.title,
        content: review.content,
        createdAt: review.createdAt,
        helpfulCount: review.helpfulCount,
        myVote: review.votes.some(
          (vote) =>
            (auth.ok && vote.userId === auth.uid) ||
            (!auth.ok && vote.sessionId && vote.sessionId === sessionId),
        ),
        verifiedBuyer: review.verifiedPurchase,
        isMine: auth.ok && review.userId === auth.uid,
        media: review.media,
      })),
      hasMore: page * pageSize < filteredTotal,
    });
  } catch (error) {
    console.error("[api/reviews] GET", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as avaliações." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.ok) {
      return NextResponse.json(
        { error: "Entre em sua conta para avaliar este produto." },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 },
      );
    }

    const { productId, rating, title, content, media } = parsed.data;

    const product = await ensureProductRecord(productId);
    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado." },
        { status: 404 },
      );
    }

    // TODO: enforce verified-purchase eligibility after purchase/order flows are unified.
    const verifiedPurchase = await prisma.orderItem.findFirst({
        where: {
          productId: product.id,
          order: {
            userId: auth.uid,
            status: { in: ["pago", "entregue", "concluido"] },
          },
        },
        take: 1,
      });
    const profile = await prisma.userProfile.upsert({
      where: { uid: auth.uid },
      create: { uid: auth.uid, interests: [], badges: [] },
      update: {},
      select: { name: true },
    });
    const userName = profile.name || "Cliente";

    // Mídia exige moderação antes de aparecer publicamente.
    const status = media.length > 0 ? "pending" : "approved";

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          productId: product.id,
          rating,
          title: title || null,
          content,
          status,
          userName,
          userId: auth.uid,
          verifiedPurchase: Boolean(verifiedPurchase),
          media: {
            create: media.map((item, index) => ({
              kind: item.kind,
              url: item.url,
              sortOrder: index,
            })),
          },
        },
        include: { media: true },
      });
      await updateProductRating(tx, product.id);
      return created;
    });

    return NextResponse.json({ review, moderation: status === "pending" }, { status: 201 });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Você já avaliou este produto. Edite sua avaliação existente." },
        { status: 409 },
      );
    }
    console.error("[api/reviews] POST", error);
    return NextResponse.json(
      { error: "Não foi possível publicar a avaliação." },
      { status: 500 },
    );
  }
}

async function updateProductRating(
  tx: Prisma.TransactionClient,
  productId: string,
) {
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