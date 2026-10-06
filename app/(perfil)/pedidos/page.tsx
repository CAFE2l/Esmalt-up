"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { m as motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  CreditCard,
  Heart,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { formatPrice } from "@/lib/products";
import { outlineButton, primaryButton } from "@/components/buttonStyles";
import {
  AmbientBackground,
  GlassBadge,
  GlassSkeleton,
  GlowToast,
  type GlowToastData,
} from "@/components/ui";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import {
  buildStatusTabs,
  computeOrdersStats,
  formatOrderDate,
  getOrderStatus,
  isCancelable,
  shortOrderId,
  type OrderStatus,
  type OrderSummary,
} from "@/lib/orders";
import {
  expandPanel,
  fadeUpItem,
  reducedMotionVariants,
  staggerContainer,
  staggerRow,
} from "@/lib/motion/variants";

type TabKey = "todos" | OrderStatus;

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Package;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <motion.div
      variants={fadeUpItem}
      className="glow-surface flex items-center gap-3 rounded-2xl p-4"
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-foreground/50">{label}</p>
        <p className="truncate text-lg font-bold text-foreground">{value}</p>
      </div>
    </motion.div>
  );
}

function OrderSkeleton() {
  return (
    <div className="glow-surface rounded-3xl p-6" aria-hidden="true">
      <div className="flex justify-between">
        <GlassSkeleton className="h-5 w-44 rounded-full" />
        <GlassSkeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="mt-4">
        <GlassSkeleton className="h-4 w-full rounded-full" count={2} />
      </div>
      <div className="mt-5">
        <GlassSkeleton className="h-9 w-32 rounded-full" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glow-surface rounded-3xl px-6 py-14 text-center"
    >
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-rosa-claro/50">
        <ShoppingBag className="h-10 w-10 text-rose-gold" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">
        Nenhum pedido ainda
      </h3>
      <p className="mt-2 text-sm text-foreground/60">
        Explore nossos kits e peças e faça seu primeiro pedido!
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/kits" className={`${primaryButton} px-6 py-2.5 text-sm`}>
          Explorar kits
        </Link>
        <Link href="/pecas-avulsas" className={`${outlineButton} px-6 py-2.5 text-sm`}>
          Ver peças avulsas
        </Link>
      </div>
    </motion.div>
  );
}

function OrderCard({
  order,
  expanded,
  onToggle,
  onReorder,
  onCancel,
  busy,
}: {
  order: OrderSummary;
  expanded: boolean;
  onToggle: () => void;
  onReorder: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const status = getOrderStatus(order.status);
  const reducedMotion = useReducedMotion();

  return (
    <motion.article
      layout
      variants={fadeUpItem}
      className="glow-surface overflow-hidden rounded-3xl"
    >
      <div className="flex flex-wrap items-center gap-3 p-5 sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-semibold text-foreground/80">
              <Package className="h-3.5 w-3.5 text-rose-gold" aria-hidden="true" />
              {shortOrderId(order.id)}
            </span>
            <GlassBadge className={status.chip} dotClassName={status.dot}>
              {status.label}
            </GlassBadge>
          </div>
          <p className="mt-2 truncate font-semibold text-foreground">{order.kitName}</p>
          <p className="mt-0.5 text-xs text-foreground/50">
            {formatOrderDate(order.createdAt)} · {order.items.length}{" "}
            {order.items.length === 1 ? "item" : "itens"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-rose-gold">
            {formatPrice(order.totalCents)}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={`order-panel-${order.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-cinza-suave/60 px-3.5 py-2 text-xs font-semibold text-foreground/70 transition-colors hover:border-rose-gold/60 hover:text-rose-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-gold"
        >
          Detalhes
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.25 }}
          >
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </motion.span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={`order-panel-${order.id}`}
            key="panel"
            variants={reducedMotion ? reducedMotionVariants.expand : expandPanel}
            initial="hidden"
            animate="show"
            exit="exit"
            className="overflow-hidden"
          >
            <div className="grid gap-6 border-t border-cinza-suave/40 p-5 sm:p-6 lg:grid-cols-2">
              <div>
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                  Andamento
                </h4>
                <OrderTimeline order={order} />
              </div>
              <div>
                <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                  Itens
                </h4>
                <ul className="space-y-2">
                  {order.items.map((item) => (
                    <li
                      key={`${item.productId}-${item.variant ?? ""}`}
                      className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2.5 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate text-foreground/80">
                        {item.productName}
                        {item.variant && (
                          <span className="text-foreground/40"> · {item.variant}</span>
                        )}
                      </span>
                      <span className="shrink-0 text-foreground/50">
                        ×{item.quantity}
                      </span>
                      <span className="shrink-0 font-semibold text-foreground">
                        {formatPrice(item.priceCents * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/pedidos/${order.id}`}
                    className={`${outlineButton} px-4 py-2 text-xs`}
                  >
                    Ver pedido completo
                  </Link>
                  <button
                    type="button"
                    onClick={onReorder}
                    disabled={busy}
                    className={`${primaryButton} gap-2 px-4 py-2 text-xs disabled:opacity-50`}
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    Comprar novamente
                  </button>
                  {isCancelable(order.status) && (
                    <button
                      type="button"
                      onClick={onCancel}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 disabled:opacity-50"
                    >
                      Cancelar pedido
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default function PedidosPage() {
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const reducedMotion = useReducedMotion();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<GlowToastData | null>(null);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/orders", {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = (await response.json().catch(() => ({}))) as {
        orders?: OrderSummary[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível carregar seus pedidos.");
      }
      setOrders(data.orders ?? []);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar seus pedidos.",
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void loadOrders();
  }, [authLoading, user, loadOrders]);

  const stats = useMemo(() => computeOrdersStats(orders), [orders]);
  const tabs = useMemo(() => buildStatusTabs(orders), [orders]);
  const visibleOrders = useMemo(
    () => (tab === "todos" ? orders : orders.filter((order) => order.status === tab)),
    [orders, tab],
  );

  const handleReorder = (order: OrderSummary) => {
    for (const item of order.items) {
      addItem(item.productId, item.quantity, {
        variantName: item.variant ?? undefined,
        product: {
          id: item.productId,
          slug: item.productId,
          kind: "peca",
          name: item.productName,
          priceCents: item.priceCents,
          imageUrl: "",
          stock: 99,
        },
      });
    }
    setToast({
      id: Date.now(),
      message: `Itens de ${shortOrderId(order.id)} adicionados à sacola.`,
    });
  };

  const handleCancel = async (order: OrderSummary) => {
    if (!user) return;
    setBusyId(order.id);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível cancelar o pedido.");
      }
      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? { ...item, status: "cancelado" } : item,
        ),
      );
      setToast({
        id: Date.now(),
        message: `Pedido ${shortOrderId(order.id)} cancelado.`,
      });
    } catch (requestError) {
      setToast({
        id: Date.now(),
        message:
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível cancelar o pedido.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const containerVariants = reducedMotion
    ? reducedMotionVariants.stagger
    : staggerContainer;
  const rowVariants = reducedMotion ? reducedMotionVariants.stagger : staggerRow;

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6" aria-busy="true">
        <GlassSkeleton className="h-8 w-56 rounded-full" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassSkeleton className="h-24 rounded-2xl" count={4} />
        </div>
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <OrderSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-rose-gold" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">Meus Pedidos</h1>
        <p className="mt-2 text-foreground/60">
          Entre para acompanhar seus pedidos.
        </p>
        <Link
          href="/login?redirect=%2Fpedidos"
          className={`${primaryButton} mt-6 px-6 py-3 text-sm`}
        >
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <>
      <AmbientBackground />
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <nav
          aria-label="Trilha de navegação"
          className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/50"
        >
          <Link href="/perfil" className="hover:text-rose-gold">
            Minha Área
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-rose-gold">Meus Pedidos</span>
        </nav>

        <motion.header
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 24 }}
          className="relative overflow-hidden rounded-3xl border border-rose-gold/20 bg-branco/40 p-6 backdrop-blur-xl sm:p-8"
        >
          <span
            aria-hidden="true"
            className="glow-led-line absolute inset-x-0 top-0 h-0.5 opacity-70"
          />
          <p className="inline-flex items-center gap-1.5 rounded-full border border-rose-gold/30 bg-rosa-claro/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-rose-gold">
            <Truck className="h-3.5 w-3.5" aria-hidden="true" />
            Acompanhamento
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Meus Pedidos
          </h1>
          <p className="mt-1 text-sm text-foreground/60">
            Tudo o que você comprou, em um só lugar.
          </p>

          <motion.div
            variants={rowVariants}
            initial="hidden"
            animate="show"
            className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <StatCard
              icon={Package}
              label="Total de pedidos"
              value={String(stats.total)}
              accent="bg-rosa-claro/60 text-rose-gold"
            />
            <StatCard
              icon={Truck}
              label="Em andamento"
              value={String(stats.inProgress)}
              accent="bg-sky-500/15 text-sky-300"
            />
            <StatCard
              icon={CreditCard}
              label="Entregues"
              value={String(stats.delivered)}
              accent="bg-emerald-500/15 text-emerald-300"
            />
            <StatCard
              icon={Wallet}
              label="Total investido"
              value={formatPrice(stats.spentCents)}
              accent="bg-amber-500/15 text-amber-300"
            />
          </motion.div>
        </motion.header>

        {error && (
          <div
            role="alert"
            className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className={`${outlineButton} border-red-400/50 px-4 py-1.5 text-xs text-red-300`}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!error && orders.length > 0 && tabs.length > 0 && (
          <div
            role="tablist"
            aria-label="Filtrar pedidos por status"
            className="mt-6 flex flex-wrap gap-2"
          >
            {(["todos", ...tabs] as TabKey[]).map((key) => {
              const active = tab === key;
              const label =
                key === "todos" ? "Todos" : getOrderStatus(key).label;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(key)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-gold ${
                    active
                      ? "bg-gradient-to-r from-rosa-blush to-rose-gold text-white shadow-card"
                      : "border border-cinza-suave/60 text-foreground/60 hover:border-rose-gold/60 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          {!error && visibleOrders.length === 0 ? (
            orders.length === 0 ? (
              <EmptyState />
            ) : (
              <p className="glow-surface rounded-3xl px-6 py-10 text-center text-sm text-foreground/60">
                Nenhum pedido com esse status.
              </p>
            )
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {visibleOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expandedId === order.id}
                  onToggle={() =>
                    setExpandedId((current) =>
                      current === order.id ? null : order.id,
                    )
                  }
                  onReorder={() => handleReorder(order)}
                  onCancel={() => void handleCancel(order)}
                  busy={busyId === order.id}
                />
              ))}
            </motion.div>
          )}
        </div>

        {orders.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Link
              href="/favoritos"
              className={`${outlineButton} gap-2 px-5 py-2.5 text-sm`}
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              Ver meus favoritos
            </Link>
          </div>
        )}
      </section>

      <GlowToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

