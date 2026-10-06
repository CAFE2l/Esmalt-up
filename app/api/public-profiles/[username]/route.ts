import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";
import { safePublicProfile } from "@/lib/publicProfiles";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: { username: string } },
) {
  try {
    const username = decodeURIComponent(params.username).toLowerCase();
    const auth = await authenticateRequest(request);
    const profile = await prisma.publicProfile.findUnique({
      where: { username },
      select: {
        userId: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        joinedAt: true,
        isPublic: true,
        allowFollows: true,
        followersCount: true,
        followingCount: true,
      },
    });
    if (!profile) {
      return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
    }
    if (!profile.isPublic && (!auth.ok || auth.uid !== profile.userId)) {
      return NextResponse.json({ private: true }, { status: 403 });
    }

    const certificate = await prisma.certificate.findFirst({
      where: { userId: profile.userId, status: "valid" },
      orderBy: { rankPosition: "asc" },
      select: {
        courseId: true,
        issuedAt: true,
        publicCode: true,
        rankPosition: true,
      },
    });
    const isFollowing = auth.ok
      ? Boolean(await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: auth.uid,
              followingId: profile.userId,
            },
          },
          select: { createdAt: true },
        }))
      : false;

    return NextResponse.json({
      profile: {
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: safePublicProfile(profile).avatarUrl,
        bio: profile.bio,
        joinedAt: profile.joinedAt,
        isPublic: profile.isPublic,
        allowFollows: profile.allowFollows,
        followersCount: profile.followersCount,
        followingCount: profile.followingCount,
        certificate: certificate
          ? {
              courseName: "Nail Designer Iniciante",
              completedAt: certificate.issuedAt,
              certificateCode: certificate.publicCode,
              rankPosition: certificate.rankPosition,
            }
          : null,
        isFollowing,
        isOwner: auth.ok && auth.uid === profile.userId,
      },
    });
  } catch (error) {
    console.error("[api/public-profiles/[username]] GET", error);
    return NextResponse.json(
      { error: "Não foi possível carregar este perfil." },
      { status: 500 },
    );
  }
}
