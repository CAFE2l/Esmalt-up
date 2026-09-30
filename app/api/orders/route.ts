import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
    const cursor = searchParams.get("cursor") || undefined;

    const orders = await prisma.order.findMany({
      where: { userId: auth.uid },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = orders.length > limit;
    const items = hasMore ? orders.slice(0, -1) : orders;

    return NextResponse.json({
      orders: items.map((order) => ({
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalCents: order.totalCents,
        kitName: order.kitName,
        createdAt: order.createdAt,
        trackingCode: order.trackingCode,
        items: order.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          priceCents: item.priceCents,
        })),
      })),
      nextCursor: hasMore ? items[items.length - 1]!.id : null,
    });
  } catch (error) {
    console.error("[api/orders] GET", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os pedidos." },
      { status: 500 }
    );
  }
}