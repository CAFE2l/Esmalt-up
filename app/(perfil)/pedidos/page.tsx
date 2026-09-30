"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

interface OrderItem {
  productName: string;
  quantity: number;
  priceCents: number;
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  totalCents: number;
  kitName: string;
  createdAt: string;
  trackingCode: string | null;
  items: OrderItem[];
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function statusIcon(status: string) {
  switch (status) {
    case "pago":
      return <CheckCircle className="h-5 w-5 text-emerald-400" />;
    case "aguardando_pagamento":
      return <Clock className="h-5 w-5 text-amber-400" />;
    case "falha_pagamento":
      return <XCircle className="h-5 w-5 text-red-400" />;
    default:
      return <Package className="h-5 w-5 text-foreground/50" />;
  }
}

export default function PedidosPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/orders", {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          setError("Não foi possível carregar os pedidos.");
          return;
        }
        const data = await response.json();
        setOrders(data.orders);
      } catch {
        setError("Erro ao carregar pedidos.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-cinza-suave/40 bg-branco p-8 text-center shadow-card">
          <Package className="mx-auto h-16 w-16 text-rose-gold" />
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            Meus Pedidos
          </h1>
          <p className="mt-2 text-foreground/60">
            Faça login para ver seus pedidos e acompanhar as entregas.
          </p>
          <Link
            href="/(auth)/login"
            className="mt-6 inline-block rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-6 py-3 text-sm font-semibold text-white shadow-card transition-all hover:-translate-y-0.5"
          >
            Fazer login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">Meus Pedidos</h1>

      {loading && (
        <p className="mt-4 text-foreground/60">Carregando pedidos...</p>
      )}
      {error && (
        <p className="mt-4 text-sm text-red-400">{error}</p>
      )}

      {!loading && orders.length === 0 && (
        <p className="mt-4 text-foreground/60">
          Você ainda não fez nenhum pedido.
        </p>
      )}

      <ul className="mt-6 space-y-4">
        {orders.map((order) => (
          <li
            key={order.id}
            className="rounded-3xl border border-cinza-suave/40 bg-branco p-6 shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {order.kitName}
                </p>
                <p className="text-xs text-foreground/50">
                  {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  · {order.id.slice(0, 8)}...
                </p>
              </div>
              <div className="flex items-center gap-2">
                {statusIcon(order.status)}
                <span className="text-sm font-medium text-foreground">
                  {order.status === "pago"
                    ? "Pago"
                    : order.status === "aguardando_pagamento"
                      ? "Aguardando pagamento"
                      : order.status === "falha_pagamento"
                        ? "Falha"
                        : order.status}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground/70">
                    {item.productName} x{item.quantity}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatPrice(item.priceCents * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-cinza-suave/30 pt-4">
              <span className="text-sm font-semibold text-foreground">
                Total
              </span>
              <span className="text-lg font-bold text-rose-gold">
                {formatPrice(order.totalCents)}
              </span>
            </div>

            {order.trackingCode && (
              <div className="mt-3 flex items-center gap-2 text-sm text-foreground/60">
                <Truck className="h-4 w-4" />
                <span>Rastreio: {order.trackingCode}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}