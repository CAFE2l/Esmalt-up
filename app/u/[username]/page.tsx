import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PublicProfileClient from "@/components/profiles/PublicProfileClient";

type Props = { params: { username: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await prisma.publicProfile.findUnique({
    where: { username: decodeURIComponent(params.username).toLowerCase() },
    select: { displayName: true, isPublic: true },
  });
  if (!profile?.isPublic) {
    return {
      title: "Perfil público",
      description: "Conheça a comunidade Esmalt'up.",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: `${profile.displayName} — Formada pela Esmalt'up`,
    description: `Conheça o perfil de ${profile.displayName}, formada pela Esmalt'up.`,
    openGraph: {
      title: `${profile.displayName} — Formada pela Esmalt'up`,
      description: `Acompanhe a trajetória de ${profile.displayName} na comunidade Esmalt'up.`,
      type: "profile",
    },
  };
}

export default function PublicProfilePage({ params }: Props) {
  return <PublicProfileClient username={decodeURIComponent(params.username).toLowerCase()} />;
}
