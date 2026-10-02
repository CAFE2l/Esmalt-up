import type { Metadata } from "next";
import { Suspense } from "react";
import VerificationForm from "@/components/certificates/VerificationForm";

export const metadata: Metadata = {
  title: "Verificar Certificado | Esmalt'up",
  description: "Verifique a autenticidade de um certificado Esmalt'up usando o código único.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerificationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rosa-claro/20 via-branco to-rosa-claro/20 p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <VerificationForm />
        </Suspense>
      </div>
    </div>
  );
}
