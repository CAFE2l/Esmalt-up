import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyIdToken } from "@/lib/serverAuth";
import { uploadBase64, MAX_UPLOAD_SIZE } from "@/lib/firebaseStorage";

type AuthResult =
  | { ok: true; uid: string }
  | { ok: false; error: string };

function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

async function authenticate(req: Request): Promise<AuthResult> {
  const token = getBearerToken(req);
  if (!token) {
    return { ok: false, error: "Não autorizado." };
  }
  try {
    const decoded = await verifyIdToken(token);
    return { ok: true, uid: decoded.uid };
  } catch {
    return { ok: false, error: "Sessão expirada. Entre novamente." };
  }
}

const MAX_SIZE = MAX_UPLOAD_SIZE; // 5 MB

export async function POST(req: Request) {
  try {
    const auth = await authenticate(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await req.json();
    const { fileBase64, fileName, folder } = body;

    if (!fileBase64 || !fileName || !folder) {
      return NextResponse.json(
        { error: "Dados inválidos. fileBase64, fileName e folder são obrigatórios." },
        { status: 400 },
      );
    }

    // Decodifica base64
    const matches = fileBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: "Formato de imagem inválido." },
        { status: 400 },
      );
    }

    const mimeType = matches[1]!;
    const base64Data = matches[2]!;
    const fileBuffer = Buffer.from(base64Data, "base64");

    if (fileBuffer.length > MAX_SIZE) {
      return NextResponse.json(
        { error: "A imagem deve ter no máximo 5 MB." },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não suportado. Use JPG, PNG ou WebP." },
        { status: 400 },
      );
    }

    let publicUrl: string;
    try {
      publicUrl = await uploadBase64({
        fileBase64,
        fileName,
        folder,
        prefix: auth.uid,
      });
    } catch (storageError) {
      console.error("[api/profile/upload] Storage init error:", storageError);
      return NextResponse.json(
        { error: "Erro de configuração do armazenamento. Contate o suporte." },
        { status: 500 },
      );
    }

    // Atualiza o perfil com a nova URL (upsert para não falhar no primeiro upload)
    const updateField = folder === "banners" ? "bannerUrl" : "profilePhotoUrl";

    await prisma.userProfile.upsert({
      where: { uid: auth.uid },
      update: { [updateField]: publicUrl },
      create: { uid: auth.uid, [updateField]: publicUrl },
    });

    return NextResponse.json({
      url: publicUrl,
      field: updateField,
    });
  } catch (error) {
    console.error("[api/profile/upload] POST", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json(
      { error: `Não foi possível fazer o upload da imagem: ${message}` },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await authenticate(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const field = searchParams.get("field");

    if (field !== "bannerUrl" && field !== "profilePhotoUrl") {
      return NextResponse.json(
        { error: "Campo inválido." },
        { status: 400 },
      );
    }

    await prisma.userProfile.update({
      where: { uid: auth.uid },
      data: { [field]: null },
    });

    return NextResponse.json({ success: true, field });
  } catch (error) {
    console.error("[api/profile/upload] DELETE", error);
    return NextResponse.json(
      { error: "Não foi possível remover a imagem." },
      { status: 500 },
    );
  }
}