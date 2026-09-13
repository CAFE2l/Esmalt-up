import { verifyIdToken } from "./serverAuth";
import { prisma } from "./prisma";

export type AuthResult =
  | { ok: true; uid: string }
  | { ok: false; error: string };

export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const token = getBearerToken(req);
  if (!token) {
    return { ok: false, error: "Não autorizado." };
  }
  try {
    const decoded = await verifyIdToken(token);
    if (!decoded.uid) {
      return { ok: false, error: "Sessão inválida." };
    }
    return { ok: true, uid: decoded.uid };
  } catch {
    return { ok: false, error: "Sessão expirada. Entre novamente." };
  }
}

/** Precisa estar logado E ser perfil empreendedor, ou usar o ADMIN_SECRET. */
export async function isAdminRequest(
  req: Request,
  uid: string,
): Promise<boolean> {
  const secretHeader = req.headers.get("x-admin-secret");
  if (
    process.env.ADMIN_SECRET &&
    secretHeader === process.env.ADMIN_SECRET
  ) {
    return true;
  }
  const profile = await prisma.userProfile.findUnique({
    where: { uid },
    select: { isEntrepreneur: true },
  });
  return Boolean(profile?.isEntrepreneur);
}