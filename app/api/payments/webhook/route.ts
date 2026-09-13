import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchMpPaymentStatus, isMpConfigured } from "@/lib/payments/mp";

export const runtime = "nodejs";

/**
 * Webhook do Mercado Pago (POST /v1/... -> /api/payments/webhook).
 * Identifica o pedido por `external_reference` e atualiza o status.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const paymentId = body?.data?.id;

    if (!paymentId && body?.action === "payment.created") {
      return NextResponse.json({ received: true });
    }
    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    // Só consulta a operadora quando configurada; em modo demo o
    // `/api/payments/status` resolve a confirmação localmente.
    const status = isMpConfigured()
      ? await fetchMpPaymentStatus(String(paymentId))
      : null;

    const updateData:
      | { paymentStatus: string; status: string; gatewayStatus: string }
      | Record<string, never> = {};

    if (status) {
      const paid = status.status === "approved";
      const failed = status.status === "rejected";
      updateData.gatewayStatus = status.rawStatus;
      updateData.paymentStatus = paid ? "paid" : failed ? "failed" : "pending";
      updateData.status = paid
        ? "pago"
        : failed
          ? "falha_pagamento"
          : "aguardando_pagamento";

      await prisma.order.updateMany({
        where: { gatewayPaymentId: String(paymentId) },
        data: updateData,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[api/payments/webhook] POST", error);
    // A operadora reenvia em caso de erro, então respondemos 200/201.
    return NextResponse.json({ received: true });
  }
}