import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { verifyIdToken } from "@/lib/serverAuth";
import { prisma } from "@/lib/prisma";
import CertificateView from "@/components/certificates/CertificateView";

export const metadata: Metadata = {
  title: "Meu Certificado | Esmalt'up",
  description: "Visualize e baixe seu certificado de conclusão do curso Nail Designer Iniciante.",
};

export const dynamic = "force-dynamic";

interface CertificatePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function CertificatePage({ searchParams }: CertificatePageProps) {
  const header = searchParams.authorization as string || "";
  
  // Try to get token from header or cookies
  let uid: string | null = null;
  
  if (header?.startsWith("Bearer ")) {
    try {
      const decoded = await verifyIdToken(header.slice(7));
      uid = decoded.uid;
    } catch {
      // Token invalid
    }
  }
  
  // If no user, redirect to login
  if (!uid) {
    redirect("/login?redirect=/certificado");
  }

  // Get user's certificate
  const certificate = await prisma.certificate.findUnique({
    where: {
      userId_courseId: {
        userId: uid,
        courseId: "nail-designer-iniciante",
      },
    },
  });

  if (!certificate) {
    redirect("/curso?bloqueada=1");
  }

  // Get site URL for QR code generation
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://esmaltup.com.br";

  return (
    <div className="min-h-screen bg-gradient-to-br from-rosa-claro/20 via-branco to-rosa-claro/20 p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Suspense fallback={null}>
          <CertificateView
            certificate={{
              publicCode: certificate.publicCode,
              recipientName: certificate.recipientName,
              issuedAt: certificate.issuedAt.toISOString(),
              courseId: certificate.courseId,
              showOnWall: certificate.showOnWall,
            }}
            siteUrl={siteUrl}
          />
        </Suspense>
      </div>
    </div>
  );
}
