"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { m as motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  Truck,
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
  formatOrderDate,
  getOrderStatus,
  isCancelable,
  shortOrderId,
  type OrderDetail,
} from "@/lib/orders";
import { fadeUpItem, reducedMotionVariants, staggerContainer } from "@/lib/motion/variants";

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <GlassSkeleton className="h-8 w-72 rounded-full" />
      <GlassSkeleton className="h-56 rounded-3xl" />
      <GlassSkeleton className="h-72 rounded-3xl" />
    </div>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-foreground/60">{label}</span>
      <span className={strong ? "font-bold text-rose-gold" : "font-medium text-foreground"}>
        {value}
      </span>
    </div>
  );
}

export default function PedidoDetalhePage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";
  const { user, loading: authLoading } = useAuth();
  const { addItem } = useCart();
  const reducedMotion = useReducedMotion();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<GlowToastData | null>(null);

  const load = useCallback(async () => {
    if (!user || !orderId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = (await response.json().catch(() => ({}))) as {
        order?: OrderDetail;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Não foi possível carregar o pedido.");
      }
      setOrder(data.order ?? null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível carregar o pedido.",
      );
    } finally {
      setLoading(false);
    }
  }, [user, orderId]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, user, load]);

  const handleReorder = () => {
    if (!order) return;
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
      message: "Itens adicionados à sacola.",
    });
  };

  const handleCancel = async () => {
    if (!user || !order) return;
    setBusy(true);
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
      setOrder({ ...order, status: "cancelado" });
      setToast({ id: Date.now(), message: "Pedido cancelado." });
    } catch (requestError) {
      setToast({
        id: Date.now(),
        message:
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível cancelar o pedido.",
      });
    } finally {
      setBusy(false);
    }
  };

  const containerVariants = reducedMotion
    ? reducedMotionVariants.stagger
    : staggerContainer;

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <DetailSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Package className="mx-auto h-12 w-12 text-rose-gold" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">Detalhe do pedido</h1>
        <p className="mt-2 text-foreground/60">Entre para ver este pedido.</p>
        <Link
          href={`/login?redirect=%2Fpedidos%2F${orderId}`}
          className={`${primaryButton} mt-6 px-6 py-3 text-sm`}
        >
          Entrar
        </Link>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Package className="mx-auto h-12 w-12 text-rose-gold/60" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">Pedido não encontrado</h1>
        <p className="mt-2 text-sm text-foreground/60">
          {error ?? "Este pedido não existe ou não pertence à sua conta."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className={`${primaryButton} gap-2 px-5 py-2.5 text-sm`}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Tentar novamente
          </button>
          <Link href="/pedidos" className={`${outlineButton} gap-2 px-5 py-2.5 text-sm`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Meus pedidos
          </Link>
        </div>
      </div>
    );
  }

  const status = getOrderStatus(order.status);
  const subtotal = order.subtotalCents ?? order.totalCents;
  const shipping = order.shippingCents ?? 0;
  const discount = order.discountCents ?? 0;

  return (
    <>
      <AmbientBackground />
      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <nav
          aria-label="Trilha de navegação"
          className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground/50"
        >
          <Link href="/perfil" className="hover:text-rose-gold">
            Minha Área
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/pedidos" className="hover:text-rose-gold">
            Meus Pedidos
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-rose-gold">{shortOrderId(order.id)}</span>
        </nav>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-5"
        >
          <motion.header
            variants={fadeUpItem}
            className="relative overflow-hidden rounded-3xl border border-rose-gold/20 bg-branco/40 p-6 backdrop-blur-xl sm:p-8"
          >
            <span
              aria-hidden="true"
              className="glow-led-line absolute inset-x-0 top-0 h-0.5 opacity-70"
            />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-foreground/50">
                  Pedido {shortOrderId(order.id)}
                </p>
                <h1 className="mt-2 text-xl font-bold text-foreground sm:text-2xl">
                  {order.kitName}
                </h1>
                <p className="mt-1 text-sm text-foreground/50">
                  Realizado em {formatOrderDate(order.createdAt)}
                </p>
              </div>
              <GlassBadge className={status.chip} dotClassName={status.dot}>
                {status.label}
              </GlassBadge>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleReorder}
                className={`${primaryButton} gap-2 px-4 py-2 text-xs`}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Comprar novamente
              </button>
              {isCancelable(order.status) && (
                <button
                  type="button"
                  onClick={() => void handleCancel()}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 disabled:opacity-50"
                >
                  Cancelar pedido
                </button>
              )}
              <Link href="/pedidos" className={`${outlineButton} gap-2 px-4 py-2 text-xs`}>
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Voltar
              </Link>
            </div>
          </motion.header>

          <div className="grid gap-5 lg:grid-cols-2">
            <motion.section
              variants={fadeUpItem}
              className="glow-surface rounded-3xl p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                <Truck className="h-4 w-4 text-rose-gold" aria-hidden="true" />
                Andamento do pedido
              </h2>
              <OrderTimeline order={order} />
            </motion.section>

            <motion.section
              variants={fadeUpItem}
              className="glow-surface rounded-3xl p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                <Package className="h-4 w-4 text-rose-gold" aria-hidden="true" />
                Itens do pedido
              </h2>
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
                    <span className="shrink-0 text-foreground/50">×{item.quantity}</span>
                    <span className="shrink-0 font-semibold text-foreground">
                      {formatPrice(item.priceCents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 space-y-2 border-t border-cinza-suave/40 pt-4">
                <SummaryRow label="Subtotal" value={formatPrice(subtotal)} />
                <SummaryRow label="Frete" value={formatPrice(shipping)} />
                {discount > 0 && (
                  <SummaryRow label="Desconto" value={`- ${formatPrice(discount)}`} />
                )}
                <SummaryRow label="Total" value={formatPrice(order.totalCents)} strong />
              </div>
            </motion.section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {order.address && (
              <motion.section
                variants={fadeUpItem}
                className="glow-surface rounded-3xl p-6"
              >
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                  <MapPin className="h-4 w-4 text-rose-gold" aria-hidden="true" />
                  Endereço de entrega
                </h2>
                <p className="text-sm leading-relaxed text-foreground/70">
                  {order.address.logradouro}, {order.address.numero}
                  {order.address.complemento && ` — ${order.address.complemento}`}
                  <br />
                  {order.address.bairro} · {order.address.cidade}/{order.address.uf}
                  <br />
                  CEP {order.address.cep}
                </p>
                {order.trackingCode && (
                  <p className="mt-3 text-sm">
                    <span className="text-foreground/50">Código de rastreio: </span>
                    <span className="font-mono font-semibold text-rose-gold">
                      {order.trackingCode}
                    </span>
                  </p>
                )}
              </motion.section>
            )}

            <motion.section
              variants={fadeUpItem}
              className="glow-surface rounded-3xl p-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-foreground">
                <CreditCard className="h-4 w-4 text-rose-gold" aria-hidden="true" />
                Pagamento
              </h2>
              <div className="space-y-2">
                <SummaryRow
                  label="Método"
                  value={
                    order.paymentMethod === "pix"
                      ? "Pix"
                      : order.paymentMethod === "boleto"
                        ? "Boleto"
                        : order.paymentMethod === "card"
                          ? "Cartão"
                          : "—"
                  }
                />
                <SummaryRow label="Status" value={status.label} />
                {order.couponCode && (
                  <SummaryRow label="Cupom" value={order.couponCode} />
                )}
              </div>
            </motion.section>
          </div>
        </motion.div>
      </section>

      <GlowToast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}


