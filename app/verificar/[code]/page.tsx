import type { Metadata } from "next";
import { Suspense } from "react";
import CertificateVerification from "@/components/certificates/CertificateVerification";

export const metadata: Metadata = {
  title: "Verificar Certificado | Esmalt'up",
  description: "Verifique a autenticidade de um certificado Esmalt'up.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: { code: string };
}

export default function VerificationCodePage({ params }: PageProps) {
  const { code } = params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rosa-claro/20 via-branco to-rosa-claro/20 p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <CertificateVerification code={code} />
        </Suspense>
      </div>
    </div>
  );
}
