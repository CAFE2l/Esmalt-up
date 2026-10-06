import type { LucideIcon } from "lucide-react";
import { Banknote, CircleCheck, PackageCheck, Sparkles, Truck } from "lucide-react";

/**
 * Esmalt'up Glow — domínio de pedidos compartilhado entre
 * /pedidos (lista) e /pedidos/[id] (detalhe).
 */

export interface OrderItemSummary {
  productId: string;
  productName: string;
  quantity: number;
  priceCents: number;
  variant: string | null;
}

export interface OrderSummary {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  kitName: string;
  createdAt: string;
  totalCents: number;
  subtotalCents?: number;
  shippingCents?: number;
  discountCents?: number;
  trackingCode?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  items: OrderItemSummary[];
}

export interface OrderDetail extends OrderSummary {
  couponCode?: string | null;
  customerName?: string | null;
  email?: string | null;
  address?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string | null;
    bairro: string;
    cidade: string;
    uf: string;
  } | null;
}

export type OrderStatus =
  | "aguardando_pagamento"
  | "pago"
  | "falha_pagamento"
  | "em_preparo"
  | "enviado"
  | "entregue"
  | "cancelado";

export interface OrderStatusConfig {
  label: string;
  /** Classes Tailwind para texto/fundo do chip. */
  chip: string;
  /** Classe da bolota LED do chip. */
  dot: string;
  /** Posição no funil (usada para a timeline). */
  step: number;
}

export const ORDER_STATUS: Record<OrderStatus, OrderStatusConfig> = {
  aguardando_pagamento: {
    label: "Aguardando pagamento",
    chip: "bg-amber-500/15 text-amber-300",
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]",
    step: 1,
  },
  pago: {
    label: "Pago",
    chip: "bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]",
    step: 2,
  },
  em_preparo: {
    label: "Em preparo",
    chip: "bg-sky-500/15 text-sky-300",
    dot: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.9)]",
    step: 3,
  },
  enviado: {
    label: "Enviado",
    chip: "bg-violet-500/15 text-violet-300",
    dot: "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]",
    step: 4,
  },
  entregue: {
    label: "Entregue",
    chip: "bg-emerald-500/15 text-emerald-300",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]",
    step: 5,
  },
  falha_pagamento: {
    label: "Falha no pagamento",
    chip: "bg-red-500/15 text-red-300",
    dot: "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)]",
    step: 1,
  },
  cancelado: {
    label: "Cancelado",
    chip: "bg-white/10 text-foreground/60",
    dot: "bg-foreground/50",
    step: 0,
  },
};

export function getOrderStatus(status: string): OrderStatusConfig {
  return ORDER_STATUS[status as OrderStatus] ?? ORDER_STATUS.aguardando_pagamento;
}

export const CANCELABLE_STATUSES: ReadonlySet<string> = new Set([
  "aguardando_pagamento",
  "pago",
]);

export function isCancelable(status: string): boolean {
  return CANCELABLE_STATUSES.has(status);
}

// ---- Timeline ----

export interface TimelineStep {
  key: string;
  label: string;
  icon: LucideIcon;
  state: "done" | "current" | "pending" | "error";
  date: string | null;
}

const fmtDateTime = (value: string | Date | null | undefined): string | null =>
  value
    ? new Date(value).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

/**
 * Monta a linha do tempo de um pedido a partir dos campos reais do banco
 * (status, createdAt, shippedAt, deliveredAt) — sem depender de histórico
 * persistido.
 */
export function buildTimeline(order: {
  status: string;
  createdAt: string | Date;
  shippedAt?: string | Date | null;
  deliveredAt?: string | Date | null;
}): TimelineStep[] {
  const steps: { key: string; label: string; icon: LucideIcon }[] = [
    { key: "pedido", label: "Pedido recebido", icon: Sparkles },
    { key: "pagamento", label: "Pagamento aprovado", icon: Banknote },
    { key: "preparo", label: "Em preparo", icon: PackageCheck },
    { key: "envio", label: "Enviado", icon: Truck },
    { key: "entrega", label: "Entregue", icon: CircleCheck },
  ];

  const dates: Record<string, string | null> = {
    pedido: fmtDateTime(order.createdAt),
    pagamento: null,
    preparo: null,
    envio: fmtDateTime(order.shippedAt),
    entrega: fmtDateTime(order.deliveredAt),
  };

  if (order.status === "cancelado" || order.status === "falha_pagamento") {
    const failureIndex = order.status === "cancelado" ? 5 : 1;
    return steps.map((step, index) => ({
      ...step,
      state:
        index === 0 || index < failureIndex
          ? "done"
          : index === failureIndex
            ? "error"
            : "pending",
      date: dates[step.key],
    }));
  }

  const currentStep = getOrderStatus(order.status).step;

  return steps.map((step, index) => ({
    ...step,
    state:
      index + 1 < currentStep
        ? "done"
        : index + 1 === currentStep
          ? "current"
          : "pending",
    date: dates[step.key],
  }));
}

// ---- Stats ----

export interface OrdersStats {
  total: number;
  inProgress: number;
  delivered: number;
  spentCents: number;
}

const IN_PROGRESS = new Set([
  "aguardando_pagamento",
  "pago",
  "em_preparo",
  "enviado",
]);

export function computeOrdersStats(orders: OrderSummary[]): OrdersStats {
  let inProgress = 0;
  let delivered = 0;
  let spentCents = 0;

  for (const order of orders) {
    if (IN_PROGRESS.has(order.status)) inProgress += 1;
    if (order.status === "entregue") delivered += 1;
    if (order.status !== "cancelado" && order.status !== "falha_pagamento") {
      spentCents += order.totalCents;
    }
  }

  return { total: orders.length, inProgress, delivered, spentCents };
}

/** Abas de filtro: status que têm ao menos um pedido. */
export function buildStatusTabs(orders: OrderSummary[]): OrderStatus[] {
  const present = new Set(orders.map((order) => order.status));
  const funnel: OrderStatus[] = [
    "aguardando_pagamento",
    "pago",
    "em_preparo",
    "enviado",
    "entregue",
  ];
  return funnel.filter((status) => present.has(status));
}

export function formatOrderDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function shortOrderId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}
