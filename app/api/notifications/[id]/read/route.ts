import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";

export const runtime = "nodejs";

/** POST /api/notifications/[id]/read — mark one notification as read */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await prisma.notification.updateMany({
      where: { id, userId: auth.uid, readAt: null },
      data: { readAt: new Date() },
    });

    if (result.count === 0) {
      // Already read or not found/owned — both are fine for the client.
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/notifications/[id]/read] POST", error);
    return NextResponse.json(
      { error: "Não foi possível marcar como lida." },
      { status: 500 },
    );
  }
}
