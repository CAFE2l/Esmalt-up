import { NextResponse } from "next/server";
import { getStorage } from "firebase-admin/storage";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { prisma } from "@/lib/prisma";
import { verifyIdToken } from "@/lib/serverAuth";

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

function getAdminStorage() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:
          process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID ?? "",
        clientEmail:
          process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL ?? "",
        privateKey: (process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "")
          .replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
  return getStorage().bucket();
}

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

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

    const extension = mimeType.split("/")[1];
    const uniqueName = `${folder}/${auth.uid}_${Date.now()}.${extension}`;

    const bucket = getAdminStorage();
    const file = bucket.file(uniqueName);

    await file.save(fileBuffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          uploadedBy: auth.uid,
        },
      },
    });

    // Torna o arquivo publicamente acessível
    await file.makePublic();

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uniqueName)}?alt=media`;

    // Atualiza o perfil com a nova URL
    const updateField = folder === "banners" ? "bannerUrl" : "profilePhotoUrl";

    await prisma.userProfile.update({
      where: { uid: auth.uid },
      data: { [updateField]: publicUrl },
    });

    return NextResponse.json({
      url: publicUrl,
      field: updateField,
    });
  } catch (error) {
    console.error("[api/profile/upload] POST", error);
    return NextResponse.json(
      { error: "Não foi possível fazer o upload da imagem." },
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