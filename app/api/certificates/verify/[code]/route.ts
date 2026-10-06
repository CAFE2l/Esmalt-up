import { NextResponse } from "next/server";
import { validatePublicCodeFormat, normalizePublicCode } from "@/lib/certificateCode";
import { getPublicCertificateByCode } from "@/lib/certificates";

// Simple in-memory rate limit (per IP, per serverless instance)
const rateLimitStore = new Map<string, { count: number; lastRequest: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 20;

function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = `verify:${ip}`;
  const record = rateLimitStore.get(key);

  if (!record || now - record.lastRequest > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { count: 1, lastRequest: now });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - record.lastRequest)) / 1000);
    return { allowed: false, retryAfter };
  }

  rateLimitStore.set(key, { count: record.count + 1, lastRequest: now });
  return { allowed: true };
}

/**
 * GET /api/certificates/verify/[code]
 * Public certificate verification. Returns only safe public fields.
 */
export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  const ip = getClientIP(req);
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { valid: false, error: "Muitas tentativas. Aguarde um instante e tente novamente." },
      {
        status: 429,
        headers: rateLimit.retryAfter ? { "Retry-After": String(rateLimit.retryAfter) } : {},
      }
    );
  }

  const normalizedCode = normalizePublicCode(params.code ?? "");

  if (!validatePublicCodeFormat(normalizedCode)) {
    return NextResponse.json(
      { valid: false, error: "Certificado não encontrado." },
      { status: 404 }
    );
  }

  try {
    const certificate = await getPublicCertificateByCode(normalizedCode);

    if (!certificate) {
      return NextResponse.json(
        { valid: false, error: "Certificado não encontrado." },
        { status: 404 }
      );
    }

    if (certificate.status === "revoked") {
      return NextResponse.json(
        {
          valid: false,
          error: "Certificado revogado.",
          status: "revoked",
          recipientName: certificate.recipientName,
          issuedAt: certificate.issuedAt.toISOString(),
          code: certificate.publicCode,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        recipientName: certificate.recipientName,
        issuedAt: certificate.issuedAt.toISOString(),
        code: certificate.publicCode,
        status: certificate.status,
        courseId: certificate.courseId,
        rankPosition: certificate.rankPosition,
        hasPublicProfile: Boolean(certificate.publicProfile),
        publicProfileId: certificate.publicProfile?.username ?? null,
        username: certificate.publicProfile?.username ?? null,
        publicProfile: certificate.publicProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Certificate verification error:", error);
    return NextResponse.json(
      { valid: false, error: "Não foi possível verificar agora. Tente novamente." },
      { status: 500 }
    );
  }
}
