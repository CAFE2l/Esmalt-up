import {
  createBoletoPayment,
  createCardPayment,
  createPixPayment,
  fetchMpPaymentStatus,
  isMpConfigured,
  type PaymentResult,
  type PurchaseData,
} from "./mp";
import { createDemoPayment } from "./demo";

export { isMpConfigured } from "./mp";
export type {
  PaymentKind,
  PaymentResult,
  PurchaseData,
} from "./mp";

/**
 * Ponto único de criação de pagamentos: usa Mercado Pago quando configurado
 * e cai no modo demonstração caso contrário.
 */
export async function createPurchasePayment(
  data: PurchaseData & { kind: PaymentResult["kind"]; card?: { token: string; installments: number } },
): Promise<PaymentResult> {
  if (!isMpConfigured()) {
    return createDemoPayment(data.kind, data.orderId, data.amount, data.card?.token);
  }

  if (!data.cpf && data.kind !== "pix") {
    throw new Error("CPF é obrigatório para boleto e cartão.");
  }

  switch (data.kind) {
    case "pix":
      return createPixPayment(data);
    case "boleto":
      return createBoletoPayment(data);
    case "card":
      if (!data.card?.token) {
        throw new Error("Token de cartão ausente.");
      }
      return createCardPayment(data, data.card);
  }
}

export async function fetchPaymentStatus(
  gatewayPaymentId: string,
): Promise<{ status: PaymentResult["status"]; rawStatus: string }> {
  if (!isMpConfigured() || gatewayPaymentId.startsWith("DEMO-")) {
    return { status: "pending", rawStatus: "demo_pending" };
  }
  return fetchMpPaymentStatus(gatewayPaymentId);
}