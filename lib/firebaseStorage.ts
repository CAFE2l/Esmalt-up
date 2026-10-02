import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
]);

/**
 * Faz upload de um arquivo base64 (`data:<mime>;base64,<data>`) para o
 * Cloudinary e devolve a URL pública segura.
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

  const safeName =
    (fileName || "arquivo")
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .slice(0, 60) || "arquivo";

  const isVideo = mimeType.startsWith("video/");
  const result = await cloudinary.uploader.upload(fileBase64, {
    folder: `esmalt-up/${folder}`,
    public_id: `${prefix ? `${prefix}_` : ""}${Date.now()}-${safeName}`,
    resource_type: isVideo ? "video" : "image",
    overwrite: false,
  });

  return result.secure_url;
}
