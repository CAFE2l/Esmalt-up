import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";
import { toWallEntry, type WallEntry, type WallStats } from "@/lib/wall";

const PAGE_SIZE = 20;
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 30;
const rateLimitStore = new Map<string, { count: number; startedAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const current = rateLimitStore.get(ip);
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW) {
    rateLimitStore.set(ip, { count: 1, startedAt: now });
    return true;
  }
  if (current.count >= RATE_LIMIT_MAX) return false;
  current.count += 1;
  return true;
}

function getPeriodStart(period: string, now: Date): Date | null {
  const start = new Date(now);
  if (period === "month") {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }
  if (period === "three-months") {
    start.setUTCMonth(start.getUTCMonth() - 3);
    return start;
  }
  if (period === "year") {
    start.setUTCMonth(0, 1);
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }
  return null;
}

const entrySelect = {
  userId: true,
  recipientName: true,
  issuedAt: true,
  publicCode: true,
  rankPosition: true,
  user: {
    select: {
      publicProfile: {
        select: {
          userId: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          isPublic: true,
          allowFollows: true,
          followersCount: true,
          followingCount: true,
        },
      },
    },
  },
} satisfies Prisma.CertificateSelect;

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Math.min(5000, Number(searchParams.get("page")) || 1));
  const order = searchParams.get("order") === "recent" ? "recent" : "rank";
  const search = searchParams.get("q")?.trim().slice(0, 80) ?? "";
  const periodStart = getPeriodStart(searchParams.get("period") ?? "all", new Date());
  const followingOnly = searchParams.get("following") === "true";
  const publicOnly = searchParams.get("publicOnly") === "true";
  const auth = await authenticateRequest(request);
  if (followingOnly && !auth.ok) {
    return NextResponse.json({ error: "Entre para filtrar quem você segue." }, { status: 401 });
  }

  try {
    let followedIds: string[] | null = null;
    if (followingOnly && auth.ok) {
      const follows = await prisma.follow.findMany({
        where: { followerId: auth.uid },
        select: { followingId: true },
      });
      followedIds = follows.map((follow) => follow.followingId);
    }

    const publicProfileFilter: Prisma.PublicProfileWhereInput = {
      isPublic: true,
      ...(search ? { displayName: { contains: search, mode: "insensitive" } } : {}),
    };
    const where: Prisma.CertificateWhereInput = {
      status: "valid",
      showOnWall: true,
      rankPosition: { not: null },
      ...(periodStart ? { issuedAt: { gte: periodStart } } : {}),
      ...(followedIds ? { userId: { in: followedIds } } : {}),
      ...(publicOnly || search
        ? { user: { is: { publicProfile: { is: publicProfileFilter } } } }
        : {}),
    };
    const orderBy: Prisma.CertificateOrderByWithRelationInput[] = order === "recent"
      ? [{ issuedAt: "desc" }, { rankPosition: "desc" }]
      : [{ rankPosition: "asc" }];
    const [total, pageRows, podiumRows, overallTotal, monthCount, todayCount, first, latest] =
      await Promise.all([
        prisma.certificate.count({ where }),
        prisma.certificate.findMany({
          where,
          orderBy,
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE + 1,
          select: entrySelect,
        }),
        prisma.certificate.findMany({
          where: { status: "valid", showOnWall: true, rankPosition: { not: null } },
          orderBy: { rankPosition: "asc" },
          take: 3,
          select: entrySelect,
        }),
        prisma.certificate.count({
          where: { status: "valid", showOnWall: true, rankPosition: { not: null } },
        }),
        prisma.certificate.count({
          where: {
            status: "valid",
            showOnWall: true,
            issuedAt: { gte: getPeriodStart("month", new Date())! },
          },
        }),
        prisma.certificate.count({
          where: {
            status: "valid",
            showOnWall: true,
            issuedAt: { gte: new Date(new Date().setUTCHours(0, 0, 0, 0)) },
          },
        }),
        prisma.certificate.findFirst({
          where: { status: "valid", showOnWall: true },
          orderBy: [{ rankPosition: "asc" }],
          select: { recipientName: true, user: { select: { publicProfile: { select: { displayName: true, isPublic: true } } } } },
        }),
        prisma.certificate.findFirst({
          where: { status: "valid", showOnWall: true },
          orderBy: [{ issuedAt: "desc" }, { rankPosition: "desc" }],
          select: { recipientName: true, user: { select: { publicProfile: { select: { displayName: true, isPublic: true } } } } },
        }),
      ]);

    const hasMore = pageRows.length > PAGE_SIZE;
    const visibleRows = hasMore ? pageRows.slice(0, PAGE_SIZE) : pageRows;
    const ids = visibleRows
      .map((row) => row.user.publicProfile?.isPublic ? row.userId : null)
      .filter((id): id is string => Boolean(id));
    const viewerFollows = auth.ok && ids.length
      ? await prisma.follow.findMany({
          where: { followerId: auth.uid, followingId: { in: ids } },
          select: { followingId: true },
        })
      : [];
    const followed = new Set(viewerFollows.map((follow) => follow.followingId));
    const entries: WallEntry[] = visibleRows.map((row) =>
      toWallEntry(row, followed.has(row.userId), auth.ok ? auth.uid : undefined),
    );
    const topThree = podiumRows.map((row) =>
      toWallEntry(row, followed.has(row.userId), auth.ok ? auth.uid : undefined),
    );
    const firstIssued = await prisma.certificate.findFirst({
      where: { status: "valid", showOnWall: true },
      orderBy: { issuedAt: "asc" },
      select: { issuedAt: true },
    });
    const monthsSinceFirst = firstIssued
      ? Math.max(1, Math.floor((Date.now() - firstIssued.issuedAt.getTime()) / (30.4375 * 86400000)) + 1)
      : 1;
    const stats: WallStats = {
      total: overallTotal,
      thisMonth: monthCount,
      today: todayCount,
      firstGraduate: first?.user.publicProfile?.isPublic
        ? first.user.publicProfile.displayName
        : first ? "Formado(a) anônimo(a)" : null,
      newestGraduate: latest?.user.publicProfile?.isPublic
        ? latest.user.publicProfile.displayName
        : latest ? "Formado(a) anônimo(a)" : null,
      averagePerMonth: Math.round(overallTotal / monthsSinceFirst),
    };

    return NextResponse.json({
      entries,
      topThree,
      total,
      page,
      pageSize: PAGE_SIZE,
      hasMore,
      stats,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[api/formados] GET", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o Hall da Fama." },
      { status: 500 },
    );
  }
}
