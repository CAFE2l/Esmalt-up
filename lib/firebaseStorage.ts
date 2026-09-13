import { getApps, cert, initializeApp } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

export function getAdminStorage() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID ?? "",
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

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

/**
 * Faz upload de um arquivo base64 (`data:<mime>;base64,<data>`) para o bucket
 * público do Firebase Storage e devolve a URL pública.
 */
export async function uploadBase64({
  fileBase64,
  fileName,
  folder,
  prefix,
}: {
  fileBase64: string;
  fileName: string;
  folder: string;
  prefix?: string;
}): Promise<string> {
  const matches = fileBase64.match(/^data:(\w+\/[a-z0-9.+-]+);base64,(.+)$/);
  if (!matches) {
    throw new Error("Formato de arquivo inválido.");
  }

  const mimeType = matches[1]!;
  const base64Data = matches[2]!;
  const fileBuffer = Buffer.from(base64Data, "base64");

  if (fileBuffer.length > MAX_UPLOAD_SIZE) {
    throw new Error("O arquivo deve ter no máximo 5 MB.");
  }
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new Error("Tipo de arquivo não suportado. Use JPG, PNG, WebP ou MP4.");
  }

  const extension = EXT_BY_MIME[mimeType];
  const safeName =
    (fileName || "arquivo")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .slice(0, 60) || "arquivo";
  const uniqueName = `${folder}/${prefix ? `${prefix}_` : ""}${Date.now()}-${safeName}.${extension}`;

  const bucket = getAdminStorage();
  const file = bucket.file(uniqueName);

  await file.save(fileBuffer, {
    metadata: {
      contentType: mimeType,
      metadata: { uploadedBy: prefix ?? "anon" },
    },
  });
  await file.makePublic();

  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uniqueName)}?alt=media`;
}