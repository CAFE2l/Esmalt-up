import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";
import { safePublicProfile } from "@/lib/publicProfiles";

const PAGE_SIZE = 20;

export async function GET(
  request: Request,
  { params }: { params: { username: string } },
) {
  try {
    const auth = await authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") === "following" ? "following" : "followers";
    const page = Math.max(1, Math.min(1000, Number(searchParams.get("page")) || 1));
    const username = decodeURIComponent(params.username).toLowerCase();
    const profile = await prisma.publicProfile.findUnique({
      where: { username },
      select: { userId: true, isPublic: true },
    });
    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    }
    if (!profile.isPublic && (!auth.ok || auth.uid !== profile.userId)) {
      return NextResponse.json({ error: "Este perfil é privado." }, { status: 403 });
    }

    const where = type === "followers"
      ? { followingId: profile.userId, follower: { isPublic: true } }
      : { followerId: profile.userId, following: { isPublic: true } };
    const [rows, total] = await Promise.all([
      prisma.follow.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE + 1,
        select: type === "followers"
          ? {
              follower: {
                select: {
                  userId: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  followersCount: true,
                  followingCount: true,
                  allowFollows: true,
                },
              },
            }
          : {
              following: {
                select: {
                  userId: true,
                  username: true,
                  displayName: true,
                  avatarUrl: true,
                  followersCount: true,
                  followingCount: true,
                  allowFollows: true,
                },
              },
            },
      }),
      prisma.follow.count({ where }),
    ]);

    const profiles = rows.map((row) => {
      const listed = type === "followers"
        ? (row as typeof rows[number] & { follower: { userId: string; username: string; displayName: string; avatarUrl: string | null; followersCount: number; followingCount: number; allowFollows: boolean } }).follower
        : (row as typeof rows[number] & { following: { userId: string; username: string; displayName: string; avatarUrl: string | null; followersCount: number; followingCount: number; allowFollows: boolean } }).following;
      return {
        ...safePublicProfile(listed),
        isFollowing: auth.ok && Boolean(
          auth.uid === listed.userId || false
        ),
      };
    });

    if (auth.ok && profiles.length) {
      const targetIds = rows.map((row) => type === "followers"
        ? (row as { follower: { userId: string } }).follower.userId
        : (row as { following: { userId: string } }).following.userId);
      const follows = await prisma.follow.findMany({
        where: { followerId: auth.uid, followingId: { in: targetIds } },
        select: { following: { select: { username: true } } },
      });
      const followed = new Set(follows.map((item) => item.following.username));
      profiles.forEach((item) => { item.isFollowing = followed.has(item.username); });
    }

    return NextResponse.json({
      profiles,
      total,
      page,
      hasMore: (page - 1) * PAGE_SIZE + rows.length < total,
    });
  } catch (error) {
    console.error("[api/public-profiles/[username]/connections] GET", error);
    return NextResponse.json(
      { error: "Não foi possível carregar esta lista." },
      { status: 500 },
    );
  }
}
