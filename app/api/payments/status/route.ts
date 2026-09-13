import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest } from "@/lib/authUtils";
import { fetchPaymentStatus } from "@/lib/payments";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const sessionId = searchParams.get("sessionId");

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId é obrigatório." },
        { status: 400 },
      );
    }

    const auth = await authenticateRequest(req);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 },
      );
    }

    // Permite consultar o próprio pedido logado ou o anônimo daquela sessão.
    const isOwner =
      (auth.ok && order.userId === auth.uid) ||
      (!auth.ok && order.sessionId && order.sessionId === sessionId);
    if (!isOwner) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    let paymentStatus = order.paymentStatus;
    let gatewayStatus = order.gatewayStatus ?? null;

    // Modo demonstração: confirma automaticamente após alguns segundos,
    // simulando o webhook da operadora.
    if (order.gatewayPaymentId?.startsWith("DEMO-")) {
      const extra = order.paymentExtra
        ? (JSON.parse(order.paymentExtra) as Record<string, unknown> | null)
        : null;
      const confirmAfterMs = (extra?.confirmAfterMs as number) ?? 8000;
      const elapsed = Date.now() - order.createdAt.getTime();
      if (paymentStatus !== "paid" && elapsed >= confirmAfterMs) {
        paymentStatus = "paid";
        gatewayStatus = "approved";
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "paid", status: "pago", gatewayStatus: "approved" },
        });
      }
    } else if (
      order.gatewayPaymentId &&
      paymentStatus !== "paid" &&
      paymentStatus !== "failed"
    ) {
      try {
        const result = await fetchPaymentStatus(order.gatewayPaymentId);
        gatewayStatus = result.rawStatus;
        if (result.status === "approved") paymentStatus = "paid";
        else if (result.status === "rejected") paymentStatus = "failed";
        if (paymentStatus !== order.paymentStatus) {
          await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus,
              status: paymentStatus === "paid" ? "pago" : order.status,
              gatewayStatus,
            },
          });
        }
      } catch {
        /* mantém estado atual se a consulta à operadora falhar */
      }
    }

    return NextResponse.json({
      orderId,
      status: paymentStatus,
      paid: paymentStatus === "paid",
      failed: paymentStatus === "failed",
      gatewayStatus,
      demo: order.gatewayPaymentId?.startsWith("DEMO-") ?? false,
    });
  } catch (error) {
    console.error("[api/payments/status] GET", error);
    return NextResponse.json(
      { error: "Não foi possível consultar o pagamento." },
      { status: 500 },
    );
  }
}