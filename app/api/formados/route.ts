import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toWallEntry, type WallPage } from "@/lib/wall";

const PAGE_SIZE = 20;
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 30;
const rateLimitStore = new Map<string, { count: number; lastRequest: number }>();

function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `formados:${ip}`;
  const record = rateLimitStore.get(key);
  if (!record || now - record.lastRequest > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { count: 1, lastRequest: now });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count += 1;
  record.lastRequest = now;
  return true;
}

/**
 * GET /api/formados?cursor=<certificateId>
 * Public, paginated list of issued certificates visible on the wall.
 * Returns ONLY recipientName, avatarUrl, issuedAt and publicCode per entry.
 */
export async function GET(req: Request) {
  if (!checkRateLimit(getClientIP(req))) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente em instantes." },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");

  try {
    const where = { status: "valid", showOnWall: true };

    const [total, rows] = await Promise.all([
      prisma.certificate.count({ where }),
      prisma.certificate.findMany({
        where,
        orderBy: [{ issuedAt: "desc" }, { id: "asc" }],
        take: PAGE_SIZE + 1,
        ...(cursor
          ? { cursor: { id: cursor }, skip: 1 }
          : {}),
        select: {
          id: true,
          recipientName: true,
          issuedAt: true,
          publicCode: true,
          user: { select: { profilePhotoUrl: true, avatarUrl: true } },
        },
      }),
    ]);

    const hasMore = rows.length > PAGE_SIZE;
    const pageRows = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = hasMore ? pageRows[pageRows.length - 1]!.id : null;

    const body: WallPage = {
      entries: pageRows.map(toWallEntry),
      total,
      nextCursor,
    };

    return NextResponse.json(body, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    console.error("[api/formados] GET", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o mural." },
      { status: 500 },
    );
  }
}
