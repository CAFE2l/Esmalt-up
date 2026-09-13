import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, isAdminRequest } from "@/lib/authUtils";
import { getProduct } from "@/lib/catalogData";
import { sendMail, buildQuestionAnsweredEmail } from "@/lib/mail";

export const runtime = "nodejs";

const answerSchema = z.object({
  questionId: z.string().min(1),
  content: z.string().min(3).max(1000),
});

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const isAdmin = await isAdminRequest(req, auth.uid);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Apenas administradores podem responder perguntas." },
        { status: 403 },
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = answerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 },
      );
    }

    const question = await prisma.question.findUnique({
      where: { id: parsed.data.questionId },
      include: { answers: true },
    });

    if (!question) {
      return NextResponse.json(
        { error: "Pergunta não encontrada." },
        { status: 404 },
      );
    }

    const profile = await prisma.userProfile.findUnique({
      where: { uid: auth.uid },
      select: { name: true },
    });

    const answer = await prisma.answer.create({
      data: {
        questionId: question.id,
        content: parsed.data.content,
        userName: profile?.name ?? "Esmalt'up",
        userId: auth.uid,
        isVendor: true,
      },
    });

    await prisma.question.update({
      where: { id: question.id },
      data: { status: "answered" },
    });

    // Notifica quem perguntou (se houver e-mail).
    const product = getProduct(question.productId);
    if (question.email) {
      await sendMail(
        buildQuestionAnsweredEmail({
          to: question.email,
          productName: product?.name ?? "produto",
          question: question.content,
          answer: parsed.data.content,
        }),
      );
    }

    return NextResponse.json({ answer }, { status: 201 });
  } catch (error) {
    console.error("[api/questions/answer] POST", error);
    return NextResponse.json(
      { error: "Não foi possível registrar a resposta." },
      { status: 500 },
    );
  }
}