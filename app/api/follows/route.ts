import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { authenticateRequest } from "@/lib/authUtils";
import { ensurePublicProfile } from "@/lib/publicProfiles";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.toLowerCase();
  if (!username) return NextResponse.json({ error: "Informe o perfil." }, { status: 400 });

  try {
    const profile = await prisma.publicProfile.findUnique({
      where: { username },
      select: {
        userId: true,
        allowFollows: true,
        followersCount: true,
        followingCount: true,
      },
    });
    if (!profile) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: auth.uid, followingId: profile.userId },
      },
      select: { createdAt: true },
    });
    return NextResponse.json({
      profile: {
        isFollowing: Boolean(follow),
        allowFollows: profile.allowFollows,
        followersCount: profile.followersCount,
        followingCount: profile.followingCount,
      },
    });
  } catch (error) {
    console.error("[api/follows] GET", error);
    return NextResponse.json({ error: "Não foi possível carregar o follow." }, { status: 500 });
  }
}

async function updateFollow(request: Request, shouldFollow: boolean) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  let username: string | undefined;
  try {
    const body = await request.json() as { username?: unknown };
    if (typeof body.username === "string") username = body.username.toLowerCase();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }
  if (!username) return NextResponse.json({ error: "Informe o perfil." }, { status: 400 });

  try {
    const actor = await ensurePublicProfile(auth.uid);
    if (!actor) return NextResponse.json({ error: "Seu perfil ainda não está disponível." }, { status: 404 });
    const target = await prisma.publicProfile.findUnique({
      where: { username },
      select: { userId: true, username: true, displayName: true, isPublic: true, allowFollows: true },
    });
    if (!target || !target.isPublic) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    if (target.userId === auth.uid) return NextResponse.json({ error: "Você não pode seguir seu próprio perfil." }, { status: 400 });
    if (shouldFollow && !target.allowFollows) {
      return NextResponse.json({ error: "Este perfil não está aceitando novos seguidores." }, { status: 403 });
    }

    let result: { followersCount: number; followingCount: number; isFollowing: boolean } | null = null;
    for (let attempt = 0; attempt < 3 && !result; attempt += 1) {
      try {
        result = await prisma.$transaction(async (tx) => {
          const key = { followerId_followingId: { followerId: auth.uid, followingId: target.userId } };
          const existing = await tx.follow.findUnique({ where: key, select: { followerId: true } });
          if (shouldFollow && !existing) {
            await tx.follow.create({ data: { followerId: auth.uid, followingId: target.userId } });
            await tx.publicProfile.update({
              where: { userId: target.userId },
              data: { followersCount: { increment: 1 } },
            });
            await tx.publicProfile.update({
              where: { userId: auth.uid },
              data: { followingCount: { increment: 1 } },
            });
            await tx.notification.create({
              data: {
                userId: target.userId,
                type: "follow",
                title: "Novo seguidor",
                body: `${actor.displayName} começou a seguir você`,
                href: `/u/${actor.username}`,
              },
            });
          } else if (!shouldFollow && existing) {
            await tx.follow.delete({ where: key });
            await tx.publicProfile.update({
              where: { userId: target.userId },
              data: { followersCount: { decrement: 1 } },
            });
            await tx.publicProfile.update({
              where: { userId: auth.uid },
              data: { followingCount: { decrement: 1 } },
            });
          }
          const [targetCounts, actorCounts] = await Promise.all([
            tx.publicProfile.findUniqueOrThrow({
              where: { userId: target.userId },
              select: { followersCount: true, allowFollows: true },
            }),
            tx.publicProfile.findUniqueOrThrow({
              where: { userId: auth.uid },
              select: { followingCount: true },
            }),
          ]);
          return {
            followersCount: targetCounts.followersCount,
            followingCount: actorCounts.followingCount,
            isFollowing: shouldFollow,
            allowFollows: targetCounts.allowFollows,
          };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034" &&
          attempt < 2
        ) continue;
        throw error;
      }
    }
    if (!result) throw new Error("Follow update did not complete.");
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/follows] mutation", error);
    return NextResponse.json({ error: "Não foi possível atualizar o follow. Tente novamente." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return updateFollow(request, true);
}

export async function DELETE(request: Request) {
  return updateFollow(request, false);
}
