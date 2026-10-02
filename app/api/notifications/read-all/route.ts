import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";

export const runtime = "nodejs";

/** POST /api/notifications/read-all — mark every notification as read */
export async function POST(req: Request) {
  const auth = await authenticateRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    await prisma.notification.updateMany({
      where: { userId: auth.uid, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/notifications/read-all] POST", error);
    return NextResponse.json(
      { error: "Não foi possível marcar como lidas." },
      { status: 500 },
    );
  }
}
