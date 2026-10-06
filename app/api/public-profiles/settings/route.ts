import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/authUtils";
import { ensurePublicProfile } from "@/lib/publicProfiles";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  try {
    const profile = await ensurePublicProfile(auth.uid);
    if (!profile) {
      return NextResponse.json({ error: "Não foi possível localizar seu perfil." }, { status: 404 });
    }
    return NextResponse.json({
      settings: {
        username: profile.username,
        displayName: profile.displayName,
        bio: profile.bio,
        isPublic: profile.isPublic,
        allowFollows: profile.allowFollows,
      },
    });
  } catch (error) {
    console.error("[api/public-profiles/settings] GET", error);
    return NextResponse.json({ error: "Não foi possível carregar as configurações." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  let body: { isPublic?: unknown; allowFollows?: unknown; bio?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }
  if (
    (body.isPublic !== undefined && typeof body.isPublic !== "boolean") ||
    (body.allowFollows !== undefined && typeof body.allowFollows !== "boolean") ||
    (body.bio !== undefined && (typeof body.bio !== "string" || body.bio.length > 160))
  ) {
    return NextResponse.json({ error: "Verifique as opções e mantenha a bio em até 160 caracteres." }, { status: 400 });
  }
  try {
    const existing = await ensurePublicProfile(auth.uid);
    if (!existing) return NextResponse.json({ error: "Não foi possível localizar seu perfil." }, { status: 404 });
    const profile = await prisma.publicProfile.update({
      where: { userId: auth.uid },
      data: {
        ...(typeof body.isPublic === "boolean" ? { isPublic: body.isPublic } : {}),
        ...(typeof body.allowFollows === "boolean" ? { allowFollows: body.allowFollows } : {}),
        ...(typeof body.bio === "string" ? { bio: body.bio.trim() || null } : {}),
      },
      select: { username: true, bio: true, isPublic: true, allowFollows: true },
    });
    return NextResponse.json({ settings: profile });
  } catch (error) {
    console.error("[api/public-profiles/settings] PATCH", error);
    return NextResponse.json({ error: "Não foi possível salvar as configurações." }, { status: 500 });
  }
}
