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
        select: {
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
      }),
      prisma.follow.count({ where }),
    ]);
    const listedProfiles = rows.map((row) =>
      type === "followers" ? row.follower : row.following,
    );
    const followed = new Set<string>();
    if (auth.ok && listedProfiles.length) {
      const follows = await prisma.follow.findMany({
        where: {
          followerId: auth.uid,
          followingId: { in: listedProfiles.map((listed) => listed.userId) },
        },
        select: { following: { select: { username: true } } },
      });
      follows.forEach((item) => followed.add(item.following.username));
    }
    const profiles = listedProfiles.map((listed) => ({
      username: listed.username,
      displayName: listed.displayName,
      avatarUrl: safePublicProfile(listed).avatarUrl,
      followersCount: listed.followersCount,
      followingCount: listed.followingCount,
      allowFollows: listed.allowFollows,
      isFollowing: followed.has(listed.username),
    }));

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
