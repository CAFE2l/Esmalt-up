import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyIdToken } from "@/lib/serverAuth";
import type { DecodedIdToken } from "firebase-admin/auth";

type AuthResult =
  | { ok: true; uid: string; decoded: DecodedIdToken }
  | { ok: false; error: string };

function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

async function authenticate(req: Request): Promise<AuthResult> {
  const token = getBearerToken(req);
  if (!token) {
    return { ok: false, error: "Não autorizado." };
  }
  try {
    const decoded = await verifyIdToken(token);
    return { ok: true, uid: decoded.uid, decoded };
  } catch {
    return { ok: false, error: "Sessão expirada. Entre novamente." };
  }
}

const editableFields = [
  "level",
  "experienceYears",
  "favoriteBrands",
  "favoriteStyles",
  "equipment",
  "courseInProgress",
  "city",
  "status",
  "interests",
  "badges",
  "youtube",
  "instagram",
  "tiktok",
] as const;

export async function GET(req: Request) {
  try {
    const auth = await authenticate(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { uid, decoded } = auth;

    const profile = await prisma.userProfile.upsert({
      where: { uid },
      update: {
        name: decoded.name ?? undefined,
        email: decoded.email ?? undefined,
        avatarUrl: decoded.picture ?? undefined,
      },
      create: {
        uid,
        name: decoded.name ?? null,
        email: decoded.email ?? null,
        avatarUrl: decoded.picture ?? null,
      },
    });

    const [orders, progress] = await Promise.all([
      prisma.order.findMany({
        where: { userId: uid },
        orderBy: { date: "desc" },
      }),
      prisma.courseProgress.findMany({
        where: { userId: uid },
        orderBy: { dateCompleted: "desc" },
      }),
    ]);

    return NextResponse.json({ profile, orders, progress });
  } catch (error) {
    console.error("[api/profile] GET", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o perfil." },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await authenticate(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    const data: Prisma.UserProfileUpdateInput = {};

    for (const field of editableFields) {
      if (field in body) {
        (data as Record<string, unknown>)[field] = body[field];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo válido enviado." },
        { status: 400 },
      );
    }

    const profile = await prisma.userProfile.upsert({
      where: { uid: auth.uid },
      update: data,
      create: {
        uid: auth.uid,
        ...(data as Record<string, unknown>),
      } as Prisma.UserProfileCreateInput,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("[api/profile] PUT", error);
    return NextResponse.json(
      { error: "Não foi possível salvar o perfil." },
      { status: 500 },
    );
  }
}