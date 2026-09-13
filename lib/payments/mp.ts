import { MercadoPagoConfig, Payment } from "mercadopago";

export type PaymentKind = "pix" | "boleto" | "card";

export interface PaymentResult {
  /** "mp" = integração real Mercado Pago; "demo" = modo demonstração. */
  mode: "mp" | "demo";
  kind: PaymentKind;
  gatewayPaymentId: string;
  status: "pending" | "approved" | "in_process" | "rejected";
  qrBase64?: string;
  copyPaste?: string;
  boletoUrl?: string | null;
  digitableLine?: string | null;
  boletoDueDate?: string;
  message?: string;
}

export function isMpConfigured(): boolean {
  return Boolean(
    process.env.MERCADO_PAGO_ACCESS_TOKEN &&
      process.env.MERCADO_PAGO_ACCESS_TOKEN.trim(),
  );
}

function getClient(): MercadoPagoConfig {
  if (!isMpConfigured()) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }
  return new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
    options: { timeout: 10000 },
  });
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export interface PurchaseData {
  orderId: string;
  description: string;
  amount: number;
  email: string;
  name: string;
  cpf?: string;
}

const payer = (data: PurchaseData) => {
  const [first_name, ...rest] = data.name.trim().split(/\s+/);
  return {
    first_name: first_name ?? data.name,
    last_name: rest.join(" ") || ".",
    email: data.email,
    identification: data.cpf
      ? { type: "CPF" as const, number: data.cpf }
      : undefined,
  };
};

export async function createPixPayment(data: PurchaseData): Promise<PaymentResult> {
  const client = new Payment(getClient());
  const created = await client.create({
    body: {
      transaction_amount: data.amount,
      description: data.description,
      payment_method_id: "pix",
      external_reference: data.orderId,
      notification_url: `${appUrl()}/api/payments/webhook`,
      payer: payer(data) as never,
      point_of_interaction: { type: "PIX" } as never,
    } as never,
  });

  const response = created as unknown as Record<string, unknown>;
  const interaction = (response.point_of_interaction as Record<string, unknown>)
    ?.transaction_data as Record<string, unknown> | undefined;

  return {
    mode: "mp",
    kind: "pix",
    gatewayPaymentId: String(response.id),
    status: statusFromMp(String(response.status)),
    qrBase64: (interaction?.qr_code_base64 as string) || undefined,
    copyPaste: (interaction?.qr_code as string) || undefined,
    message: "Pague com PIX usando o QR Code ou o código copia e cola.",
  };
}

export async function createBoletoPayment(
  data: PurchaseData,
): Promise<PaymentResult> {
  const due = new Date();
  due.setDate(due.getDate() + 3);

  const client = new Payment(getClient());
  const created = await client.create({
    body: {
      transaction_amount: data.amount,
      description: data.description,
      payment_method_id: "bolbradesco",
      external_reference: data.orderId,
      notification_url: `${appUrl()}/api/payments/webhook`,
      date_of_expiration: due.toISOString(),
      payer: payer(data) as never,
    } as never,
  });

  const response = created as unknown as Record<string, unknown>;
  const details = response.transaction_details as Record<string, unknown> | undefined;
  const barcode = response.barcode as Record<string, unknown> | undefined;

  return {
    mode: "mp",
    kind: "boleto",
    gatewayPaymentId: String(response.id),
    status: statusFromMp(String(response.status)),
    boletoUrl: (details?.external_resource_url as string) || null,
    digitableLine: (barcode?.content as string) || (details?.digitable_line as string) || null,
    boletoDueDate: due.toISOString(),
    message: "O boleto pode ser pago em qualquer banco ou app até o vencimento.",
  };
}

export async function createCardPayment(
  data: PurchaseData,
  card: {
    token: string;
    installments: number;
  },
): Promise<PaymentResult> {
  const client = new Payment(getClient());
  const created = await client.create({
    body: {
      transaction_amount: data.amount,
      description: data.description,
      payment_method_id: "card",
      external_reference: data.orderId,
      notification_url: `${appUrl()}/api/payments/webhook`,
      installments: card.installments,
      token: card.token,
      payer: payer(data) as never,
    } as never,
  });

  const response = created as unknown as Record<string, unknown>;

  return {
    mode: "mp",
    kind: "card",
    gatewayPaymentId: String(response.id),
    status: statusFromMp(String(response.status)),
    message: response.status_detail
      ? String(response.status_detail)
      : undefined,
  };
}

type MpStatus = "pending" | "approved" | "in_process" | "rejected";

function statusFromMp(status: string): MpStatus {
  if (status === "approved") return "approved";
  if (status === "rejected" || status === "cancelled") return "rejected";
  if (status === "in_process") return "in_process";
  return "pending";
}

export async function fetchMpPaymentStatus(
  gatewayPaymentId: string,
): Promise<{ status: MpStatus; rawStatus: string }> {
  const client = new Payment(getClient());
  const result = await client.get({ id: gatewayPaymentId });
  const response = result as unknown as Record<string, unknown>;
  const raw = String(response.status ?? "unknown");
  return { status: statusFromMp(raw), rawStatus: raw };
}