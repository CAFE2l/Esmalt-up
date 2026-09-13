import type { PaymentKind, PaymentResult } from "./mp";

/**
 * Modo demonstração (sem MERCADO_PAGO_ACCESS_TOKEN).
 *
 * Gera instruções de pagamento simuladas para permitir desenvolver e
 * testar o fluxo completo de checkout. Nunca realiza cobrança real e é
 * identificado claramente na interface.
 */

const ANON_ID_PREFIX = "DEMO";

function demoQrSvg(code: string): string {
  const size = 21;
  const cell = 10;
  const padding = 20;
  const total = size * cell + padding * 2;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}">`;
  svg += `<rect width="${total}" height="${total}" rx="18" fill="#ffffff"/>`;
  const hash = (seed: number) => {
    const x = Math.sin(seed * 999) * 10000;
    return (x - Math.floor(x)) * 255;
  };
  let seed = 7;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const finder =
        (row < 7 && col < 7) ||
        (row < 7 && col >= size - 7) ||
        (row >= size - 7 && col < 7);
      const center = (row >= 2 && row < 5 && col >= 2 && col < 5) ||
        (row >= 2 && row < 5 && col >= size - 5 && col < size - 2) ||
        (row >= size - 5 && row < size - 2 && col >= 2 && col < 5);
      const on = finder ? true : center ? false : (hash(seed + row * size + col) & 1) === 0;
      seed += row * 31 + col;
      if (on || finder) {
        svg += `<rect x="${padding + col * cell}" y="${padding + row * cell}" width="${cell}" height="${cell}" fill="${center ? "#ffffff" : "#1a1015"}"/>`;
      }
    }
  }
  svg += `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function demoCopyPaste(orderId: string): string {
  return `00020126580014br.gov.bcb.pix0136${ANON_ID_PREFIX}-${orderId.replace(/\W/g, "").slice(0, 12)}5204000053039865802BR5909Esmaltup6009SAO PAULO62290525DEMO-NAO-COBRA-VALOR6304E1F2`;
}

function demoDueDate(): string {
  const due = new Date();
  due.setDate(due.getDate() + 3);
  return due.toISOString();
}

export function createDemoPayment(
  kind: PaymentKind,
  orderId: string,
  amount: number,
  cardToken?: string,
): PaymentResult {
  const base: PaymentResult = {
    mode: "demo",
    kind,
    gatewayPaymentId: `${ANON_ID_PREFIX}-${orderId}`,
    status: "pending",
    message:
      "Modo demonstração: configure MERCADO_PAGO_ACCESS_TOKEN para cobranças reais.",
  };

  if (kind === "pix") {
    return {
      ...base,
      qrBase64: demoQrSvg(orderId),
      copyPaste: demoCopyPaste(orderId),
      message:
        "Cobrança simulada — o pagamento será confirmado automaticamente após alguns segundos.",
    };
  }

  if (kind === "boleto") {
    return {
      ...base,
      boletoUrl: null,
      digitableLine: `00190.00009 ${ANON_ID_PREFIX}1.${orderId.replace(/\W/g, "").slice(0, 8)}.0000xxxx-0`,
      boletoDueDate: demoDueDate(),
      message:
        "Boleto simulado — vencimento em 3 dias. O pagamento será confirmado automaticamente.",
    };
  }

  // card
  const approved = cardToken?.startsWith("4111") || cardToken?.startsWith("510000") || false;
  return {
    ...base,
    status: approved ? "approved" : "rejected",
    message: approved
      ? "Pagamento aprovado (simulação). Cartão de teste: 4111 1111 1111 1111."
      : "Cartão recusado na simulação. Use o cartão de teste 4111 1111 1111 1111.",
  };
}