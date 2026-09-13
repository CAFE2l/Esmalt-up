import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";
import { getProduct } from "@/lib/catalogData";

export const runtime = "nodejs";

const askSchema = z.object({
  productId: z.string().min(1),
  content: z.string().min(5).max(600),
  name: z.string().min(2).max(80),
  email: z.string().email().optional(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    if (!productId) {
      return NextResponse.json(
        { error: "productId é obrigatório." },
        { status: 400 },
      );
    }

    const questions = await prisma.question.findMany({
      where: { productId, status: "answered" },
      orderBy: [{ createdAt: "desc" }],
      take: 20,
      include: {
        answers: {
          orderBy: [{ isVendor: "desc" }, { createdAt: "asc" }],
          include: { helpful: true },
        },
      },
    });

    return NextResponse.json({
      questions,
      answeredCount: questions.length,
    });
  } catch (error) {
    console.error("[api/questions] GET", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as perguntas." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req).catch(() => ({
      ok: false,
      error: "Não autorizado.",
    }));

    const body = await req.json().catch(() => null);
    const parsed = askSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 },
      );
    }

    const { productId, content, name, email } = parsed.data;
    if (!getProduct(productId)) {
      return NextResponse.json(
        { error: "Produto não encontrado." },
        { status: 400 },
      );
    }

    const question = await prisma.question.create({
      data: {
        productId,
        content,
        userName: name,
        email,
        userId: auth.ok ? auth.uid : null,
        status: "pending",
      },
    });

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("[api/questions] POST", error);
    return NextResponse.json(
      { error: "Não foi possível registrar a pergunta." },
      { status: 500 },
    );
  }
}