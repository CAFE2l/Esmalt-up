"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Download, QrCode } from "lucide-react";
import { getQRCodeImageURL } from "@/lib/qrCode";
import { CERTIFICATE_CURRICULUM } from "@/data/certificateCurriculum";
import { getCertificateConfig, type CertificateConfig } from "@/lib/certificateConfig";
import { formatDatePtBR } from "@/lib/certificates";

interface CertificateRendererProps {
  certificate: {
    publicCode: string;
    recipientName: string;
    issuedAt: string;
    courseId?: string;
  };
  siteUrl: string;
  onDownload?: (type: 'front' | 'back' | 'pdf') => void;
  showControls?: boolean;
}

/**
 * Auto-shrinking text component
 * Reduces font size until text fits within max width
 */
function AutoFitText({
  text,
  className = "",
  maxWidth = 400,
  minFontSize = 12,
  maxFontSize = 48,
  fontFamily = '"Poppins", sans-serif',
}: {
  text: string;
  className?: string;
  maxWidth?: number;
  minFontSize?: number;
  maxFontSize?: number;
  fontFamily?: string;
}) {
  const [fontSize, setFontSize] = useState(maxFontSize);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const checkFit = () => {
      const isOverflowing = element.scrollWidth > (maxWidth || element.clientWidth);
      
      if (isOverflowing && fontSize > (minFontSize || 12)) {
        setFontSize(prev => Math.max(prev - 2, minFontSize || 12));
      } else if (!isOverflowing && fontSize < maxFontSize) {
        // Try to increase font size
        setFontSize(prev => Math.min(prev + 2, maxFontSize));
      }
    };

    // Initial check
    checkFit();
    
    // Add resize observer
    const observer = new ResizeObserver(checkFit);
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [text, maxWidth, fontSize, minFontSize, maxFontSize]);

  return (
    <span
      ref={textRef}
      className={className}
      style={{
        fontFamily,
        fontSize: `${fontSize}px`,
        maxWidth: maxWidth ? `${maxWidth}px` : undefined,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
      }}
    >
      {text}
    </span>
  );
}

/**
 * Certificate Front Side
 * Uses absolute positioning over the certificate background image
 */
function CertificateFront({
  certificate,
  config,
  siteUrl,
}: {
  certificate: CertificateRendererProps["certificate"];
  config: CertificateConfig;
  siteUrl: string;
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
          // Fallback to solid background if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.backgroundColor = '#fef7f8';
          target.style.backgroundImage = 'linear-gradient(135deg, #fef7f8 0%, #fdf0f2 100%)';
        }}
      />

      {/* Absolute positioned overlays */}
      <div className="absolute inset-0 p-4 flex flex-col">
        {/* Recipient Name - Centered */}
        <div
          className="absolute text-center"
          style={{
            left: `${config.front.recipientName.x}%`,
            top: `${config.front.recipientName.y}%`,
            transform: 'translate(-50%, -50%)',
            width: config.front.recipientName.maxWidth ? `${config.front.recipientName.maxWidth}%` : '80%',
          }}
        >
          <AutoFitText
            text={recipientName}
            className="font-semibold"
            fontFamily={config.front.nameFont || '"Georgia", "Times New Roman", serif'}
            minFontSize={16}
            maxFontSize={48}
          />
        </div>

        {/* Issue Date */}
        <div
          className="absolute text-center"
          style={{
            left: `${config.front.issueDate.x}%`,
            top: `${config.front.issueDate.y}%`,
            transform: 'translate(-50%, -50%)',
            width: config.front.issueDate.maxWidth ? `${config.front.issueDate.maxWidth}%` : '80%',
          }}
        >
          <span
            className="text-rose-gold font-medium"
            style={{
              fontFamily: config.front.dateFont,
              fontSize: config.front.issueDate.fontSize,
              color: config.front.issueDate.color,
            }}
          >
            {issueDate}
          </span>
        </div>

        {/* Certificate ID */}
        <div
          className="absolute text-center"
          style={{
            left: `${config.front.certificateId.x}%`,
            top: `${config.front.certificateId.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span
            className="text-sm"
            style={{
              fontFamily: config.front.idFont,
              fontSize: config.front.certificateId.fontSize,
              color: config.front.certificateId.color,
            }}
          >
            ID: {publicCode}
          </span>
        </div>

        {/* Signature */}
        <div
          className="absolute"
          style={{
            left: `${config.front.signature.x}%`,
            top: `${config.front.signature.y}%`,
            width: `${config.front.signature.width}%`,
            height: `${config.front.signature.height || config.front.signature.width * 0.4}%`,
          }}
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

        {/* QR Code */}
        {config.front.qrCode && (
          <div
            className="absolute"
            style={{
              left: `${config.front.qrCode.x}%`,
              top: `${config.front.qrCode.y}%`,
              width: `${config.front.qrCode.width}%`,
            }}
          >
            <img
              src={getQRCodeImageURL(qrCodeUrl, Math.min(config.width, 150))}
              alt="Código QR de verificação"
              className="w-full h-full object-contain bg-white p-1 rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Certificate Back Side
 * Professional HTML/CSS layout with curriculum content
 */
function CertificateBack({
  certificate,
  config: _config,
  siteUrl,
}: {
  certificate: CertificateRendererProps["certificate"];
  config: CertificateConfig;
  siteUrl: string;
}) {
  const { publicCode, recipientName, issuedAt } = certificate;
  const issueDate = formatDatePtBR(new Date(issuedAt));
  const qrCodeUrl = `${siteUrl}/verificar/${publicCode}`;

  // Split curriculum into pages if content is too long
  const _isLongContent = CERTIFICATE_CURRICULUM.units.length > 3 || 
    CERTIFICATE_CURRICULUM.units.some(u => u.lessons.length > 6);

  return (
    <div className="bg-branco min-h-full p-6 sm:p-8 text-sm">
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b border-cinza-suave/20">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Conteúdo Programático – Certificado
        </h2>
        <p className="text-rose-gold font-semibold">
          {CERTIFICATE_CURRICULUM.courseName}
        </p>
      </div>

      {/* Recipient and certificate info */}
      <div className="mb-6 p-4 rounded-xl bg-rosa-claro/10 border border-rosa-claro/20">
        <p className="text-center">
          <span className="text-foreground/50">Certificado emitido para:</span>{' '}
          <span className="font-semibold text-foreground">{recipientName}</span>
        </p>
        <p className="text-center mt-1">
          <span className="text-foreground/50">Data:</span>{' '}
          <span className="font-medium text-foreground">{issueDate}</span>
        </p>
        <p className="text-center mt-1">
          <span className="text-foreground/50">ID do Certificado:</span>{' '}
          <span className="font-mono font-medium text-foreground">{publicCode}</span>
        </p>
      </div>

      {/* Curriculum content - grouped by units */}
      <div className="space-y-6">
        {CERTIFICATE_CURRICULUM.units.map((unit) => (
          <div key={unit.unitNumber} className="break-inside-avoid">
            <h3 className="text-base font-bold text-foreground mb-1">
              Unidade {unit.unitNumber}: {unit.title}
            </h3>
            <p className="text-foreground/70 text-sm mb-3">{unit.subtitle}</p>

            <div className="space-y-2 ml-2">
              {unit.lessons.map((lesson) => (
                <div key={lesson.id} className="mb-2">
                  <p className="font-medium text-foreground">
                    {lesson.isBonus ? "Aula Bônus" : `Aula ${lesson.order}`}: {lesson.title}
                    {lesson.isBonus && (
                      <span className="ml-2 text-xs bg-rose-gold/10 text-rose-gold px-2 py-0.5 rounded-full">Bônus</span>
                    )}
                  </p>
                  <p className="text-xs text-foreground/60">
                    Vídeo de {lesson.creator}
                  </p>
                  <ul className="list-disc list-inside text-xs text-foreground/80 mt-1">
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
      <div className="mt-8 pt-6 border-t border-cinza-suave/20">
        <h3 className="text-base font-bold text-foreground mb-3">
          Competências Desenvolvidas
        </h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {CERTIFICATE_CURRICULUM.competencies.map((competency, index) => (
            <li key={index} className="text-foreground/80">{competency}</li>
          ))}
        </ul>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-cinza-suave/20 text-center">
        <p className="text-xs text-foreground/60 mb-2">
          Verificar autenticidade: {siteUrl}/verificar/{publicCode}
        </p>
        <p className="text-xs text-foreground/50">
          Certificado simbólico, emitido apenas por diversão.
        </p>
        <p className="text-xs text-foreground/50 mt-1">
          Este não é um diploma ou curso regulamentado.
        </p>
      </div>

      {/* QR Code for easy verification */}
      <div className="mt-6 flex justify-center">
        <img
          src={getQRCodeImageURL(qrCodeUrl, 100)}
          alt="Código QR de verificação"
          className="w-24 h-24 object-contain bg-white p-1 rounded border"
        />
      </div>
    </div>
  );
}

/**
 * Main Certificate Renderer Component
 */
export default function CertificateRenderer({
  certificate,
  siteUrl,
  showControls = true,
  onDownload,
}: CertificateRendererProps) {
  const config = getCertificateConfig(certificate.courseId);
  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
  const frontRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback((type: 'front' | 'back' | 'pdf') => {
    onDownload?.(type);
  }, [onDownload]);

  // Download PNG function
  const downloadPNG = useCallback(async (element: HTMLDivElement | null, filename: string) => {
    if (!element) return;

    try {
      const canvas = await html2canvas(element);
      if (canvas) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) {
      console.error('Error generating PNG:', error);
      // Fallback: create a simple download
      alert('Não foi possível gerar a imagem. Por favor, tente usar a função de impressão do navegador.');
    }
  }, []);

  const downloadFrontPNG = useCallback(() => {
    downloadPNG(frontRef.current, `certificado-fente-${certificate.recipientName.replace(/\s+/g, '-')}.png`);
    handleDownload('front');
  }, [certificate.recipientName, downloadPNG, handleDownload]);

  const downloadBackPNG = useCallback(async () => {
    // For back, we need to capture the back content
    // This is a bit more complex since it's not in the DOM
    // For now, we'll handle it through the parent component
    handleDownload('back');
  }, [handleDownload]);

  // Load html2canvas dynamically if needed
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.html2canvas) {
      const script = document.createElement('script');
      script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
      script.async = true;
      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Certificate display */}
      <div className="relative bg-white rounded-2xl shadow-card-lg overflow-hidden mb-6">
        {/* Front view */}
        <div
          ref={frontRef}
          className={`transition-opacity duration-300 ${activeView === 'front' ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
          style={{ aspectRatio: `${config.width}/${config.height}` }}
        >
          <CertificateFront
            certificate={certificate}
            config={config}
            siteUrl={siteUrl}
          />
        </div>

        {/* Back view */}
        <div
          className={`transition-opacity duration-300 ${activeView === 'back' ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
          style={{ 
            aspectRatio: `${config.width}/${config.height}`,
            minHeight: config.height,
          }}
        >
          <CertificateBack
            certificate={certificate}
            config={config}
            siteUrl={siteUrl}
          />
        </div>
      </div>

      {/* View toggle */}
      {showControls && (
        <div className="flex justify-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setActiveView('front')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
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
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeView === 'back'
                ? 'bg-rose-gold text-white'
                : 'bg-branco text-foreground border border-cinza-suave/40 hover:bg-rosa-claro/10'
            }`}
          >
            Verso
          </button>
        </div>
      )}

      {/* Download buttons */}
      {showControls && (
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={downloadFrontPNG}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rosa-blush to-rose-gold text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:brightness-105 active:scale-95 shadow-card hover:shadow-card-lg"
          >
            <Download className="h-4 w-4" />
            Baixar frente (PNG)
          </button>
          
          <button
            type="button"
            onClick={downloadBackPNG}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rosa-blush to-rose-gold text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:brightness-105 active:scale-95 shadow-card hover:shadow-card-lg"
          >
            <QrCode className="h-4 w-4" />
            Baixar verso (PNG)
          </button>

          {typeof window !== 'undefined' && window.jsPDF && (
            <button
              type="button"
              onClick={() => handleDownload('pdf')}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rosa-blush to-rose-gold text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:brightness-105 active:scale-95 shadow-card hover:shadow-card-lg"
            >
              <Download className="h-4 w-4" />
              Baixar PDF (2 páginas)
            </button>
          )}
        </div>
      )}

      {showControls && (
        <p className="mt-6 text-center text-xs text-foreground/50">
          Este é um certificado simbólico. Para imprimi-lo, use um papel de qualidade e {' '}
          <span className="text-foreground">imprima em modo paisagem</span>.
        </p>
      )}
    </div>
  );
}
