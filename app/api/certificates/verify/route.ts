import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validatePublicCodeFormat, normalizePublicCode } from "@/lib/certificates";

// Rate limiting in-memory store (simple implementation)
const rateLimitStore = new Map<string, { count: number; lastRequest: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 20; // 20 requests per minute per IP

function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = `verify:${ip}`;
  const record = rateLimitStore.get(key);
  
  if (!record) {
    rateLimitStore.set(key, { count: 1, lastRequest: now });
    return { allowed: true };
  }
  
  // Reset if window passed
  if (now - record.lastRequest > RATE_LIMIT_WINDOW) {
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
 * Verify a certificate by its public code
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const ip = getClientIP(req);
  const rateLimit = checkRateLimit(ip);
  
  if (!rateLimit.allowed) {
    // Return same error regardless to prevent enumeration
    return NextResponse.json(
      { 
        valid: false, 
        error: "Código não encontrado." 
      },
      { 
        status: 429,
        headers: rateLimit.retryAfter ? { "Retry-After": String(rateLimit.retryAfter) } : {},
      }
    );
  }

  const { code } = await params;
  const normalizedCode = normalizePublicCode(code);

  // Validate format first (but don't reveal if format is wrong vs not found)
  if (!validatePublicCodeFormat(normalizedCode)) {
    // Return same response as "not found" to prevent enumeration
    return NextResponse.json(
      { 
        valid: false, 
        error: "Código não encontrado." 
      },
      { status: 404 }
    );
  }

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { publicCode: normalizedCode },
      select: {
        publicCode: true,
        recipientName: true,
        issuedAt: true,
        status: true,
      },
    });

    if (!certificate) {
      // Same response time/shape for all invalid codes
      return NextResponse.json(
        { 
          valid: false, 
          error: "Código não encontrado." 
        },
        { status: 404 }
      );
    }

    // Always return the same response structure, just change the valid field
    if (certificate.status === "revoked") {
      return NextResponse.json(
        { 
          valid: false, 
          error: "Certificado revogado.",
          status: "revoked",
          recipientName: certificate.recipientName,
          issuedAt: certificate.issuedAt.toISOString(),
        },
        { status: 200 }
      );
    }

    // Valid certificate
    return NextResponse.json(
      { 
        valid: true,
        recipientName: certificate.recipientName,
        issuedAt: certificate.issuedAt.toISOString(),
        code: certificate.publicCode,
        status: certificate.status,
      },
      { status: 200 }
    );
  } catch (error) {
    // Log without sensitive data
    console.error("Certificate verification error:", error);
    
    // Return generic error to prevent information leakage
    return NextResponse.json(
      { 
        valid: false, 
        error: "Código não encontrado." 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/certificates/verify
 * Verify a certificate by POST (for form submissions)
 */
export async function POST(req: Request) {
  const ip = getClientIP(req);
  const rateLimit = checkRateLimit(ip);
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { 
        valid: false, 
        error: "Código não encontrado." 
      },
      { 
        status: 429,
        headers: rateLimit.retryAfter ? { "Retry-After": String(rateLimit.retryAfter) } : {},
      }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { valid: false, error: "Código não encontrado." },
      { status: 400 }
    );
  }

  const { code } = body as { code?: string };
  
  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { valid: false, error: "Código não encontrado." },
      { status: 400 }
    );
  }

  const normalizedCode = normalizePublicCode(code);

  // Validate format first
  if (!validatePublicCodeFormat(normalizedCode)) {
    return NextResponse.json(
      { valid: false, error: "Código não encontrado." },
      { status: 404 }
    );
  }

  try {
    const certificate = await prisma.certificate.findUnique({
      where: { publicCode: normalizedCode },
      select: {
        publicCode: true,
        recipientName: true,
        issuedAt: true,
        status: true,
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { valid: false, error: "Código não encontrado." },
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
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Certificate verification error:", error);
    return NextResponse.json(
      { valid: false, error: "Código não encontrado." },
      { status: 500 }
    );
  }
}
