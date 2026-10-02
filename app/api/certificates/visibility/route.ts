import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIdToken } from "@/lib/serverAuth";

async function getUid(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const decoded = await verifyIdToken(header.slice(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

/**
 * PATCH /api/certificates/visibility
 * Body: { showOnWall: boolean }
 * Toggles whether the user's certificate appears on the public wall.
 * Does NOT alter the certificate itself or its verification page.
 */
export async function PATCH(req: Request) {
  const uid = await getUid(req);
  if (!uid) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const showOnWall = (body as { showOnWall?: unknown })?.showOnWall;
  if (typeof showOnWall !== "boolean") {
    return NextResponse.json(
      { error: "showOnWall deve ser booleano." },
      { status: 400 },
    );
  }

  try {
    const certificate = await prisma.certificate.findFirst({
      where: { userId: uid, courseId: "nail-designer-iniciante" },
      select: { id: true },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: "Certificado não encontrado." },
        { status: 404 },
      );
    }

    await prisma.certificate.update({
      where: { id: certificate.id },
      data: { showOnWall },
    });

    return NextResponse.json({ success: true, showOnWall });
  } catch (error) {
    console.error("[api/certificates/visibility] PATCH", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a visibilidade." },
      { status: 500 },
    );
  }
}
