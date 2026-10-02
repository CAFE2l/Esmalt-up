"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Download, QrCode, ArrowLeft } from "lucide-react";
import { getQRCodeImageURL } from "@/lib/qrCode";
import { CERTIFICATE_CURRICULUM } from "@/data/certificateCurriculum";
import { getCertificateConfig } from "@/lib/certificateConfig";
import { formatDatePtBR } from "@/lib/certificates";

interface CertificateViewProps {
  certificate: {
    publicCode: string;
    recipientName: string;
    issuedAt: string;
    courseId?: string;
    showOnWall?: boolean;
  };
  siteUrl: string;
}

/**
 * Auto-shrinking text component for certificate name
 */
function CertificateName({
  name,
  className = "",
  maxWidth = 500,
}: {
  name: string;
  className?: string;
  maxWidth?: number;
}) {
  const [fontSize, setFontSize] = useState(28);
  const [isMeasuring, setIsMeasuring] = useState(true);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMeasuring || !textRef.current) return;

    const element = textRef.current;
    const parentWidth = element.parentElement?.clientWidth || maxWidth;
    const availableWidth = parentWidth * 0.85; // 85% of parent width
    
    // Start with a large font and reduce until it fits
    let currentSize = 28;
    
    const testFit = (size: number): boolean => {
      element.style.fontSize = `${size}px`;
      // Use scrollWidth to check if text overflows
      return element.scrollWidth <= availableWidth;
    };

    // Binary search for optimal font size
    let low = 16;
    let high = 48;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (testFit(mid)) {
        currentSize = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    setFontSize(currentSize);
    setIsMeasuring(false);
  }, [name, maxWidth, isMeasuring]);

  // Re-measure on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMeasuring(true);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      ref={textRef}
      className={`whitespace-nowrap overflow-hidden ${className}`}
      style={{
        fontSize: isMeasuring ? undefined : `${fontSize}px`,
        fontFamily: '"Georgia", "Times New Roman", serif',
        fontWeight: 600,
        color: '#2d2227',
        maxWidth: `${maxWidth}px`,
      }}
    >
      {name}
    </div>
  );
}

/**
 * Certificate Front Component
 */
function CertificateFrontView({
  certificate,
  config: _config,
  siteUrl,
  showSignature = true,
  showQRCode = false,
}: {
  certificate: CertificateViewProps["certificate"];
  config: ReturnType<typeof getCertificateConfig>;
  siteUrl: string;
  showSignature?: boolean;
  showQRCode?: boolean;
}) {
  const { publicCode, recipientName, issuedAt } = certificate;
  const issueDate = formatDatePtBR(new Date(issuedAt));
  const qrCodeUrl = `${siteUrl}/verificar/${publicCode}`;

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background image */}
      <img
        src="/certificate-front.png"
        alt="Fundo do certificado"
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.backgroundColor = '#fef7f8';
          target.style.backgroundImage = 'linear-gradient(135deg, #fef7f8 0%, #fdf0f2 100%)';
        }}
      />

      <div className="absolute inset-0 p-4 flex flex-col">
        {/* Recipient Name */}
        <div className="absolute left-1/2 top-[35%] -translate-x-1/2 w-[80%] text-center">
          <CertificateName name={recipientName} maxWidth={400} />
        </div>

        {/* Issue Date */}
        <div className="absolute left-1/2 top-[45%] -translate-x-1/2 w-[80%] text-center">
          <span className="text-rose-gold font-medium" style={{ fontSize: 'clamp(0.875rem, 2.5vw, 1rem)' }}>
            {issueDate}
          </span>
        </div>

        {/* Certificate ID */}
        <div className="absolute left-1/2 top-[85%] -translate-x-1/2">
          <span className="text-sm" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>
            ID: {publicCode}
          </span>
        </div>

        {/* Signature */}
        {showSignature && (
          <div
            className="absolute left-[65%] top-[75%] w-[25%] h-[10%]"
          >
            <img
              src="/signature-esmaltup.png"
              alt="Assinatura Esmalt'up"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* QR Code */}
        {showQRCode && (
          <div className="absolute right-4 top-4 w-24 h-24 bg-white p-1 rounded shadow-lg">
            <img
              src={getQRCodeImageURL(qrCodeUrl, 100)}
              alt="Código QR"
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Certificate Back Component
 */
function CertificateBackView({
  certificate,
  siteUrl,
}: {
  certificate: CertificateViewProps["certificate"];
  siteUrl: string;
}) {
  const { publicCode, recipientName, issuedAt } = certificate;
  const issueDate = formatDatePtBR(new Date(issuedAt));
  const qrCodeUrl = `${siteUrl}/verificar/${publicCode}`;

  return (
    <div className="bg-branco min-h-full p-4 sm:p-6 text-xs sm:text-sm">
      {/* Header */}
      <div className="text-center mb-4 pb-3 border-b border-cinza-suave/20">
        <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">
          Conteúdo Programático
        </h2>
        <p className="text-rose-gold font-semibold text-sm sm:text-base">
          {CERTIFICATE_CURRICULUM.courseName}
        </p>
      </div>

      {/* Recipient info */}
      <div className="mb-4 p-3 rounded-lg bg-rosa-claro/10 border border-rosa-claro/20">
        <p className="text-center">
          <span className="text-foreground/50">Emitido para: </span>
          <span className="font-semibold text-foreground">{recipientName}</span>
        </p>
        <p className="text-center mt-1">
          <span className="text-foreground/50">Data: </span>
          <span className="font-medium text-foreground">{issueDate}</span>
        </p>
        <p className="text-center mt-1">
          <span className="text-foreground/50">ID: </span>
          <span className="font-mono font-medium text-foreground">{publicCode}</span>
        </p>
      </div>

      {/* Curriculum content */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {CERTIFICATE_CURRICULUM.units.map((unit) => (
          <div key={unit.unitNumber} className="break-inside-avoid">
            <h3 className="font-bold text-foreground mb-1 text-sm sm:text-base">
              Unidade {unit.unitNumber}: {unit.title}
            </h3>
            <p className="text-foreground/70 text-xs mb-2">{unit.subtitle}</p>

            <div className="space-y-2 ml-2">
              {unit.lessons.map((lesson) => (
                <div key={lesson.id} className="mb-2">
                  <p className="font-medium text-foreground text-sm">
                    {lesson.isBonus ? "Aula Bônus" : `Aula ${lesson.order}`}: {lesson.title}
                    {lesson.isBonus && (
                      <span className="ml-2 text-[10px] bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full">Bônus</span>
                    )}
                  </p>
                  <p className="text-[10px] sm:text-xs text-foreground/60">
                    Vídeo de {lesson.creator}
                  </p>
                  <ul className="list-disc list-inside text-[10px] sm:text-xs text-foreground/80 mt-1 pl-3">
                    {lesson.learningObjectives.map((objective, objIndex) => (
                      <li key={objIndex}>{objective}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Competencies section */}
      <div className="mt-6 pt-4 border-t border-cinza-suave/20">
        <h3 className="font-bold text-foreground mb-2 text-sm sm:text-base">
          Competências Desenvolvidas
        </h3>
        <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-foreground/80 pl-3">
          {CERTIFICATE_CURRICULUM.competencies.map((competency, index) => (
            <li key={index}>{competency}</li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-cinza-suave/20 text-center">
        <p className="text-[10px] sm:text-xs text-foreground/60 mb-1">
          Verificar: {siteUrl}/verificar/{publicCode}
        </p>
        <p className="text-[10px] sm:text-xs text-foreground/50">
          Certificado simbólico, emitido apenas por diversão.
        </p>
        <p className="text-[10px] sm:text-xs text-foreground/50 mt-1">
          Este não é um diploma ou curso regulamentado.
        </p>
      </div>

      {/* QR Code */}
      <div className="mt-4 flex justify-center">
        <img
          src={getQRCodeImageURL(qrCodeUrl, 80)}
          alt="Código QR de verificação"
          className="w-20 h-20 object-contain bg-white p-1 rounded border"
        />
      </div>
    </div>
  );
}

/**
 * Main Certificate View Component
 */
export default function CertificateView({ certificate, siteUrl }: CertificateViewProps) {
  const config = getCertificateConfig(certificate.courseId);
  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
  const [isLoading, setIsLoading] = useState(false);
  const frontRef = useRef<HTMLDivElement>(null);
  const [wallVisible, setWallVisible] = useState(certificate.showOnWall !== false);
  const [wallBusy, setWallBusy] = useState(false);
  const [wallError, setWallError] = useState<string | null>(null);

  const toggleWall = useCallback(async () => {
    setWallBusy(true);
    setWallError(null);
    try {
      // Certificate pages are public; fetch needs the caller's token when available.
      let token: string | null = null;
      try {
        const { auth } = await import("@/lib/firebase");
        token = (await auth?.currentUser?.getIdToken()) ?? null;
      } catch {
        token = null;
      }
      const res = await fetch("/api/certificates/visibility", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ showOnWall: !wallVisible }),
      });
      if (!res.ok) throw new Error();
      setWallVisible((v) => !v);
    } catch {
      setWallError("Não foi possível atualizar. Tente novamente.");
    } finally {
      setWallBusy(false);
    }
  }, [wallVisible]);

  const handleDownload = useCallback((type: 'front' | 'back' | 'pdf') => {
    setIsLoading(true);

    try {
      if (type === 'front' && frontRef.current) {
        // For now, just open the certificate page for full functionality
        // In production, you could use html2canvas or similar libraries
        alert('Para baixar a imagem da frente, use a função de impressão do navegador ou capturador de tela.');
      } else if (type === 'back') {
        alert('Para baixar o verso, use a função de impressão do navegador.');
      } else if (type === 'pdf') {
        // Use browser print
        window.print();
      }
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Não foi possível baixar. Por favor, use a função de impressão do navegador.');
    } finally {
      setIsLoading(false);
    }
  }, [certificate.recipientName]);

  // Note: For screenshot functionality, we use browser print or external libraries
  // html2canvas would need to be added as a dependency for client-side rendering

  return (
    <div className="w-full">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/curso"
          className="inline-flex items-center gap-2 text-foreground hover:text-rose-gold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o curso
        </Link>
      </div>

      {/* Certificate display area */}
      <div className="relative bg-white rounded-2xl shadow-card-lg overflow-hidden mb-6">
        <div
          ref={frontRef}
          className={`transition-opacity duration-300 ${activeView === 'front' ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
          style={{ aspectRatio: `${config.width}/${config.height}` }}
        >
          <CertificateFrontView
            certificate={certificate}
            config={config}
            siteUrl={siteUrl}
            showSignature={true}
          />
        </div>

        <div
          className={`transition-opacity duration-300 ${activeView === 'back' ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
          style={{ aspectRatio: `${config.width}/${config.height}` }}
        >
          <CertificateBackView certificate={certificate} siteUrl={siteUrl} />
        </div>
      </div>

      {/* View toggle and download controls */}
      <div className="space-y-4">
        {/* View toggle */}
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('front')}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              activeView === 'front' 
                ? 'bg-rose-gold text-white' 
                : 'bg-branco text-foreground border border-cinza-suave/40 hover:bg-rosa-claro/10'
            }`}
          >
            Frente
          </button>
          <button
            type="button"
            onClick={() => setActiveView('back')}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              activeView === 'back'
                ? 'bg-rose-gold text-white'
                : 'bg-branco text-foreground border border-cinza-suave/40 hover:bg-rosa-claro/10'
            }`}
          >
            Verso
          </button>
        </div>

        {/* Download buttons */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => handleDownload('front')}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rosa-blush to-rose-gold text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:brightness-105 active:scale-95 shadow-card hover:shadow-card-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Download className="h-4 w-4" />
                Baixar frente (PNG)
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => handleDownload('back')}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rosa-blush to-rose-gold text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:brightness-105 active:scale-95 shadow-card hover:shadow-card-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <QrCode className="h-4 w-4" />
            Baixar verso (PNG)
          </button>

          <button
            type="button"
            onClick={() => handleDownload('pdf')}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rosa-blush to-rose-gold text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:brightness-105 active:scale-95 shadow-card hover:shadow-card-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Baixar PDF
          </button>
        </div>
      </div>

      {/* Help text */}
      <div className="mt-6 text-center text-xs sm:text-sm text-foreground/60">
        <p className="mb-2">
          Este é um <strong className="text-foreground">certificado simbólico</strong>, emitido apenas por diversão.
        </p>
        <p>
          Para imprimir, use papel de qualidade e selecione modo <strong className="text-foreground">paisagem</strong>.
        </p>
      </div>

      {/* Verification info */}
      <div className="mt-4 p-4 rounded-xl bg-rosa-claro/10 border border-rosa-claro/20 text-center">
        <p className="text-xs text-foreground/70">
          Código de verificação: <code className="font-mono text-foreground">{certificate.publicCode}</code>
        </p>
        <p className="text-xs text-foreground/50 mt-1">
          {siteUrl}/verificar/{certificate.publicCode}
        </p>
      </div>

      {/* Wall visibility toggle */}
      <div className="mt-4 rounded-xl border border-cinza-suave/30 bg-branco/60 p-4">
        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block text-sm font-semibold text-foreground">
              Aparecer no mural
            </span>
            <span className="block text-xs text-foreground/60">
              Mostra seu nome, foto e data de conclusão no Mural de Formados.
            </span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={wallVisible}
            aria-label="Aparecer no mural"
            disabled={wallBusy}
            onClick={toggleWall}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 ${
              wallVisible ? "bg-rose-gold" : "bg-cinza-suave"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                wallVisible ? "translate-x-[22px]" : "translate-x-[2px]"
              }`}
            />
          </button>
        </label>
        {wallBusy && (
          <p className="mt-2 text-xs text-foreground/60">Atualizando…</p>
        )}
        {wallError && (
          <p role="alert" className="mt-2 text-xs text-red-300">{wallError}</p>
        )}
      </div>
    </div>
  );
}
