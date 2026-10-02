"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import { Package, Truck, ShoppingBag } from "lucide-react";
import { outlineButton } from "@/components/buttonStyles";
import { formatPrice } from "@/lib/products";

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pago: { label: "Pago", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  aguardando_pagamento: { label: "Aguardando pagamento", color: "text-amber-400", bg: "bg-amber-500/20" },
  falha_pagamento: { label: "Falha", color: "text-red-400", bg: "bg-red-500/20" },
  em_preparo: { label: "Em preparo", color: "text-blue-400", bg: "bg-blue-500/20" },
  enviado: { label: "Enviado", color: "text-purple-400", bg: "bg-purple-500/20" },
  entregue: { label: "Entregue", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  cancelado: { label: "Cancelado", color: "text-gray-400", bg: "bg-gray-500/20" },
};

function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-cinza-suave/40 bg-branco p-6 shadow-card animate-pulse">
      <div className="h-4 w-32 rounded-full bg-cinza-suave/30 mb-3" />
      <div className="h-3 w-24 rounded-full bg-cinza-suave/20 mb-4" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full bg-cinza-suave/20" />
        <div className="h-3 w-2/3 rounded-full bg-cinza-suave/20" />
      </div>
      <div className="mt-4 h-8 w-24 rounded-full bg-cinza-suave/20" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-cinza-suave/40 bg-branco p-12 text-center shadow-card">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rosa-claro/30">
        <ShoppingBag className="h-10 w-10 text-rose-gold" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        Nenhum pedido ainda
      </h3>
      <p className="mt-2 text-sm text-foreground/60">
        Explore nossos kits e peças e faça seu primeiro pedido!
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/kits" className={`${outlineButton} px-6 py-2.5 text-sm`}>Explorar kits</Link>
        <Link href="/pecas-avulsas" className={`${outlineButton} px-6 py-2.5 text-sm`}>Ver peças avulsas</Link>
      </div>
    </div>
  );
}

export default function PedidosPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return; }
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/orders", { headers: { authorization: `Bearer ${token}` } });
        if (!response.ok) { setError("Não foi possível carregar os pedidos."); return; }
        const data = await response.json();
        setOrders(data.orders);
      } catch { setError("Erro ao carregar pedidos."); }
      finally { setLoading(false); }
    }
    void load();
  }, [user]);

  const filteredOrders = statusFilter === "todos" ? orders : orders.filter((o) => o.status === statusFilter);
  const statusOptions = ["todos", "pago", "aguardando_pagamento", "falha_pagamento", "em_preparo", "enviado", "entregue", "cancelado"];

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-3xl border border-cinza-suave/40 bg-branco p-8 text-center shadow-card">
          <Package className="mx-auto h-16 w-16 text-rose-gold" />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Meus Pedidos</h1>
          <p className="mt-2 text-foreground/60">Faça login para ver seus pedidos.</p>
          <Link href="/(auth)/login" className="mt-6 inline-block rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-6 py-3 text-sm font-semibold text-white shadow-card">Fazer login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <nav className="mb-4 flex items-center gap-2 text-xs text-foreground/60">
        <Link href="/perfil" className="hover:text-rose-gold">MINHA ÁREA</Link>
        <span aria-hidden>/</span>
        <span className="text-foreground/80">Pedidos</span>
      </nav>
      <h1 className="text-2xl font-bold text-foreground">Meus Pedidos</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {statusOptions.map((opt) => (
          <button key={opt} type="button" onClick={() => setStatusFilter(opt)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === opt ? "bg-rosa-blush/20 text-rose-gold" : "border border-cinza-suave/50 text-foreground/60 hover:text-foreground"}`}>
            {opt === "todos" ? "Todos" : STATUS_CONFIG[opt]?.label || opt}
          </button>
        ))}
      </div>

      {loading && <div className="mt-6 space-y-4"><SkeletonCard /><SkeletonCard /></div>}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {!loading && orders.length === 0 && <EmptyState />}
      {!loading && filteredOrders.length === 0 && <p className="mt-4 text-foreground/60">Nenhum pedido com esse status.</p>}

      <ul className="mt-6 space-y-4">
        {filteredOrders.map((order) => {
          const sc = STATUS_CONFIG[order.status] || STATUS_CONFIG["aguardando_pagamento"];
          return (
            <li key={order.id} className="rounded-3xl border border-cinza-suave/40 bg-branco p-6 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{order.kitName}</p>
                  <p className="text-xs text-foreground/50">{new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })} · {order.id.slice(0, 8)}...</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${sc.bg} ${sc.color}`}>{sc.label}</span>
              </div>
              <div className="mt-4 space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground/70">{item.productName} x{item.quantity}</span>
                    <span className="font-medium text-foreground">{formatPrice(item.priceCents * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-cinza-suave/30 pt-4">
                <span className="text-sm font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-rose-gold">{formatPrice(order.totalCents)}</span>
              </div>
              {order.trackingCode && (
                <div className="mt-3 flex items-center gap-2 text-sm text-foreground/60">
                  <Truck className="h-4 w-4" />
                  <span>Rastreio: {order.trackingCode}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
