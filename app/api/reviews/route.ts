import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, getBearerToken } from "@/lib/authUtils";
import { getProduct } from "@/lib/catalogData";

export const runtime = "nodejs";

const createSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  content: z.string().min(4).max(2000),
  media: z
    .array(
      z.object({
        kind: z.enum(["image", "video"]),
        url: z.string().url(),
      }),
    )
    .max(5)
    .default([]),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const sort = searchParams.get("sort") ?? "recent";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = 8;

    if (!productId) {
      return NextResponse.json(
        { error: "productId é obrigatório." },
        { status: 400 },
      );
    }

    const where = { productId, status: "approved" };

    const [reviews, total, grouped] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy:
          sort === "helpful"
            ? [{ helpfulCount: "desc" }, { createdAt: "desc" }]
            : sort === "rating"
              ? [{ rating: "desc" }, { createdAt: "desc" }]
              : { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          media: { orderBy: { sortOrder: "asc" } },
          votes: true,
        },
      }),
      prisma.review.count({ where }),
      prisma.review.groupBy({
        by: ["rating"],
        where,
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
      distribution,
      items: reviews.map((review) => ({
        id: review.id,
        userName: review.userName,
        rating: review.rating,
        title: review.title,
        content: review.content,
        createdAt: review.createdAt,
        helpfulCount: review.helpfulCount,
        myVote: review.votes.length > 0,
        media: review.media,
      })),
      hasMore: page * pageSize < total,
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
    const auth = await authenticateRequest(req).catch(() => ({
      ok: false,
      error: "Não autorizado.",
    }));
    const isAuth = auth.ok;

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

    if (!getProduct(productId)) {
      return NextResponse.json(
        { error: "Produto não encontrado." },
        { status: 400 },
      );
    }

    let userName = "Cliente";
    let userId: string | null = null;

    if (isAuth) {
      userId = auth.uid;
      const profile = await prisma.userProfile.findUnique({
        where: { uid: auth.uid },
        select: { name: true },
      });
      if (profile?.name) userName = profile.name;
    }

    // Mídia exige moderação antes de aparecer publicamente.
    const status = media.length > 0 ? "pending" : "approved";

    const review = await prisma.review.create({
      data: {
        productId,
        rating,
        title: title || null,
        content,
        status,
        userName,
        userId,
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

    return NextResponse.json({ review, moderation: status === "pending" }, { status: 201 });
  } catch (error) {
    console.error("[api/reviews] POST", error);
    return NextResponse.json(
      { error: "Não foi possível publicar a avaliação." },
      { status: 500 },
    );
  }
}