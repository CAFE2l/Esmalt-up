import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/authUtils";
import { uploadBase64 } from "@/lib/firebaseStorage";

export const runtime = "nodejs";

const uploadSchema = z.object({
  fileBase64: z.string().min(1),
  fileName: z.string().min(1).max(120),
  kind: z.enum(["image", "video"]).default("image"),
});

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = uploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 },
      );
    }

    const { fileBase64, fileName, kind } = parsed.data;

    const url = await uploadBase64({
      fileBase64,
      fileName,
      folder: `reviews/${kind}`,
      prefix: auth.uid,
    });

    return NextResponse.json({ url, kind });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload falhou.";
    if (message.includes("máximo") || message.includes("suportado")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("[api/reviews/upload] POST", error);
    return NextResponse.json(
      { error: "Não foi possível enviar a mídia." },
      { status: 500 },
    );
  }
}