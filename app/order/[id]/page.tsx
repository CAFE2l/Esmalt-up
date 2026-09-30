import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/products";
import { CheckCircle2, Package, Truck, CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface OrderPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sessionId?: string }>;
}

async function getOrder(id: string, sessionId?: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payment: true },
  });

  if (!order) return null;

  // Allow access if session matches (for anonymous orders)
  if (!sessionId && order.sessionId) {
    // For now, require auth for order details
    return null;
  }

  return order;
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Pedido #${id.slice(0, 8)} | Esmalt'up`,
    description: `Acompanhe seu pedido #${id.slice(0, 8)}`,
  };
}

function statusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case "pago":
      return { label: "Pago", color: "bg-emerald-500/20 text-emerald-400" };
    case "aguardando_pagamento":
      return { label: "Aguardando pagamento", color: "bg-amber-500/20 text-amber-400" };
    case "falha_pagamento":
      return { label: "Falha no pagamento", color: "bg-red-500/20 text-red-400" };
    case "cancelado":
      return { label: "Cancelado", color: "bg-gray-500/20 text-gray-400" };
    default:
      return { label: status, color: "bg-rosa-claro/30 text-foreground/70" };
  }
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { id } = await params;
  const { sessionId } = await searchParams;
  const order = await getOrder(id, sessionId);

  if (!order) notFound();

  const status = statusLabel(order.status);
  const isPix = order.paymentMethod === "pix";
  const isCard = order.paymentMethod === "card";
  const isBoleto = order.paymentMethod === "boleto";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Success header */}
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-400" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          {order.status === "pago" ? "Pedido confirmado!" : "Pedido recebido!"}
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          Número do pedido: <span className="font-mono font-semibold text-rose-gold">#{id.slice(0, 8)}</span>
        </p>
      </div>

      {/* Status badge */}
      <div className="mt-6 flex items-center justify-center">
        <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Order details */}
      <div className="mt-8 space-y-6">
        {/* Items */}
        <section className="rounded-3xl border border-cinza-suave/40 bg-rosa-claro/10 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Package className="h-5 w-5 text-rose-gold" />
            Itens do pedido
          </h2>
          <ul className="mt-4 space-y-3">
            {order.items.map((item) => (
              <li key={item.productId} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.productName}</p>
                  <p className="text-xs text-foreground/50">
                    Qty: {item.quantity} × {formatPrice(item.priceCents)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatPrice(item.priceCents * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Shipping */}
        <section className="rounded-3xl border border-cinza-suave/40 bg-rosa-claro/10 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <Truck className="h-5 w-5 text-rose-gold" />
            Endereço de entrega
          </h2>
          <div className="mt-3 text-sm text-foreground/70">
            <p>{order.shippingAddress}</p>
            {order.shippingCity && <p>{order.shippingCity} - {order.shippingState}</p>}
            {order.shippingCep && <p>CEP: {order.shippingCep}</p>}
          </div>
          {order.shippingMethod && (
            <p className="mt-2 text-xs text-foreground/50">Frete: {order.shippingMethod}</p>
          )}
        </section>

        {/* Payment */}
        <section className="rounded-3xl border border-cinza-suave/40 bg-rosa-claro/10 p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <CreditCard className="h-5 w-5 text-rose-gold" />
            Pagamento
          </h2>
          <div className="mt-3 text-sm text-foreground/70">
            <p>
              {isPix && "PIX"}
              {isCard && "Cartão de crédito"}
              {isBoleto && "Boleto bancário"}
              {!isPix && !isCard && !isBoleto && order.paymentMethod}
            </p>
            {order.paymentStatus === "pending" && (
              <p className="mt-1 text-amber-400">Aguardando confirmação...</p>
            )}
            {order.paymentStatus === "paid" && (
              <p className="mt-1 text-emerald-400">Pago</p>
            )}
            {order.paymentStatus === "failed" && (
              <p className="mt-1 text-red-400">Falha no pagamento</p>
            )}
          </div>
        </section>

        {/* Totals */}
        <section className="rounded-3xl border border-cinza-suave/40 bg-rosa-claro/10 p-6">
          <h2 className="text-base font-bold text-foreground">Resumo</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between text-foreground/70">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotalCents)}</span>
            </div>
            {order.discountCents && order.discountCents > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Desconto</span>
                <span>-{formatPrice(order.discountCents)}</span>
              </div>
            )}
            {order.shippingCents && order.shippingCents > 0 && (
              <div className="flex justify-between text-foreground/70">
                <span>Frete</span>
                <span>{formatPrice(order.shippingCents)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 text-base font-bold text-rose-gold">
              <span>Total</span>
              <span>{formatPrice(order.totalCents)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="flex-1 rounded-full border border-cinza-suave/50 bg-branco py-3 text-center text-sm font-semibold text-foreground transition-colors hover:border-rose-gold hover:text-rose-gold"
        >
          Continuar comprando
        </Link>
        <Link
          href="/(perfil)/perfil"
          className="flex-1 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold py-3 text-center text-sm font-bold text-white shadow-lg"
        >
          Ver meus pedidos
        </Link>
      </div>
    </div>
  );
}
