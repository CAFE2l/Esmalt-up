"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import {
  getProduct,
  formatPrice,
} from "@/lib/catalogData";
import { calculateFreight, isCepComplete, lookupCep, type CepAddress } from "@/lib/shipping";
import CardForm, { type CardFields } from "@/components/checkout/CardForm";
import { cn } from "@/lib/cn";

type Step = 1 | 2 | 3;
type Method = "pix" | "boleto" | "card";

interface OrderResult {
  orderId: string;
  totalCents: number;
  demo: boolean;
  gateway: string;
  discounts: { subtotalCents: number; discountCents: number; shippingCents: number };
  instructions: {
    kind: Method;
    status: string;
    qrBase64?: string;
    copyPaste?: string;
    boletoUrl?: string | null;
    digitableLine?: string | null;
    boletoDueDate?: string;
    message?: string;
  };
}

const inputClass =
  "w-full rounded-full border border-cinza-suave/50 bg-branco px-4 py-3 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-rosa-blush";

function StepBadge({ current, step, label }: { current: Step; step: Step; label: string }) {
  const done = current > step;
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "grid h-8 w-8 place-items-center rounded-full text-sm font-bold",
          current === step
            ? "bg-gradient-to-r from-rosa-blush to-rose-gold text-white"
            : done
              ? "bg-emerald-500/20 text-emerald-500"
              : "bg-rosa-claro text-foreground/50",
        )}
      >
        {done ? "✓" : step}
      </span>
      <span className={cn("text-sm", current === step ? "font-semibold text-foreground" : "text-foreground/50")}>
        {label}
      </span>
    </div>
  );
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, itemCount, subtotalCents, couponState, sessionId, clearCart } = useCart();

  const [step, setStep] = useState<Step>(1);
  const [identity, setIdentity] = useState({ name: "", email: "", cpf: "" });
  const [address, setAddress] = useState({
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
  });
  const [cepStatus, setCepStatus] = useState<"idle" | "loading" | "error" | "ok">("idle");
  const [method, setMethod] = useState<Method>("pix");
  const [card, setCard] = useState<CardFields | null>(null);
  const [cardValid, setCardValid] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [paid, setPaid] = useState(false);
  const [pollError, setPollError] = useState(false);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const freight = useMemo(
    () => calculateFreight({ subtotalCents, itemCount }),
    [subtotalCents, itemCount],
  );
  const discount = couponState.discountCents;
  const totalEstimate = Math.max(0, subtotalCents - discount + freight.cents);

  // Preenche identidade se logado.
  useEffect(() => {
    if (user?.email) {
      setIdentity((current) => ({
        ...current,
        email: current.email || user.email || "",
        name: current.name || user.displayName || "",
      }));
    }
  }, [user]);

  useEffect(() => () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
  }, []);

  const fillCep = async (cepValue: string) => {
    if (!isCepComplete(cepValue)) return;
    setCepStatus("loading");
    const result = (await lookupCep(cepValue)) as CepAddress | null;
    if (result?.logradouro) {
      setAddress((current) => ({
        ...current,
        logradouro: current.logradouro || result.logradouro || "",
        bairro: current.bairro || result.bairro || "",
        cidade: current.cidade || result.localidade || "",
        uf: current.uf || result.uf || "",
      }));
      setCepStatus("ok");
    } else {
      setCepStatus("error");
    }
  };

  const identityValid =
    identity.name.trim().length >= 2 && /.+@.+\..+/.test(identity.email);

  const addressValid =
    isCepComplete(address.cep) &&
    address.logradouro.trim().length >= 2 &&
    address.numero.trim().length >= 1 &&
    address.bairro.trim().length >= 2 &&
    address.cidade.trim().length >= 2 &&
    address.uf.trim().length === 2;

  const canSubmit = !submitting && (method !== "card" || cardValid);

  const finishCheckout = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = await user?.getIdToken().catch(() => null);
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId,
          items,
          customer: {
            name: identity.name,
            email: identity.email,
            cpf: identity.cpf.replace(/\D/g, "").slice(0, 11) || undefined,
          },
          address: {
            cep: address.cep.replace(/\D/g, ""),
            logradouro: address.logradouro,
            numero: address.numero,
            complemento: address.complemento || undefined,
            bairro: address.bairro,
            cidade: address.cidade,
            uf: address.uf.toUpperCase(),
          },
          couponCode: couponState.coupon?.code ?? undefined,
          payment: {
            method,
            card:
              method === "card" && card
                ? {
                    token: `DEMO-${card.number.replace(/\D/g, "")}`,
                    installments: card.installments,
                  }
                : undefined,
          },
        }),
      });

      const data = (await response.json()) as OrderResult & { error?: string };
      if (!response.ok) {
        setSubmitError(data.error ?? "Não foi possível processar o pedido.");
        return;
      }

      setOrder(data);
      clearCart();
      setPaid(data.instructions.status === "approved");
    } catch {
      setSubmitError("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const pollStatus = () => {
    if (!order) return;
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/payments/status?orderId=${order.orderId}&sessionId=${sessionId ?? ""}`,
        );
        const data = (await response.json()) as { paid: boolean; failed: boolean };
        if (data.paid) {
          if (pollTimer.current) clearInterval(pollTimer.current);
          setPaid(true);
        } else if (data.failed) {
          if (pollTimer.current) clearInterval(pollTimer.current);
          setPollError(true);
        }
      } catch {
        /* mantém conferindo */
      }
    }, 2500);
  };

  useEffect(() => {
    if (order && order.instructions.status === "pending") pollStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.orderId]);

  // ---------- carrinho vazio (sem pedido em andamento) ----------
  if (!order && items.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 text-2xl font-bold">Seu carrinho está vazio</h1>
        <p className="mt-2 text-foreground/60">
          Adicione kits e peças avulsas para montar seu carrinho.
        </p>
        <Link
          href="/kits"
          className="mt-6 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-8 py-3 text-sm font-bold text-white shadow-lg"
        >
          Ver kits
        </Link>
      </div>
    );
  }

  // ---------- pedido pago! ----------
  if (order && paid) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-bold sm:text-3xl">Pedido confirmado!</h1>
        <p className="mt-2 text-foreground/70">
          Pedido{" "}
          <span className="font-mono font-semibold text-rose-gold">{order.orderId}</span>
        </p>
        <p className="mt-1 text-sm text-foreground/60">
          Enviamos a confirmação para <strong>{identity.email}</strong>. Acompanhe
          seu pedido na área do perfil.
        </p>
        {order.demo && (
          <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500">
            Pedido em modo demonstração — nenhuma cobrança real foi feita.
          </p>
        )}
        <div className="mt-8 flex justify-center">
          <Link
            href="/kits"
            className="rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-8 py-3 text-sm font-bold text-white shadow-lg"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    );
  }

  // ---------- aguardando pagamento (PIX / boleto) ----------
  if (order && !order.demo && order.instructions.kind !== "card" && !paid) {
    return <CheckoutLoading />;
  }

  if (order && !paid) {
    const ins = order.instructions;

    // Cartão recusado — volta para o formulário.
    if (order.demo && ins.status === "rejected") {
      return (
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-500/15 text-red-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-8 w-8">
              <path d="M12 8v5m0 3h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z" />
            </svg>
          </div>
          <h1 className="mt-6 text-xl font-bold">Pagamento recusado</h1>
          <p className="mt-2 text-sm text-foreground/70">{ins.message}</p>
          <button
            type="button"
            onClick={() => setOrder(null)}
            className="mt-6 rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-8 py-3 text-sm font-bold text-white shadow-lg"
          >
            Tentar outro cartão
          </button>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-2xl font-bold">
          {ins.status === "rejected" ? "Pagamento recusado" : "Aguardando pagamento"}
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Pedido{" "}
          <span className="font-mono font-medium text-rose-gold">{order.orderId}</span>
          {" · "}
          <strong>{formatPrice(order.totalCents)}</strong>
        </p>

        {pollError && (
          <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            O pagamento não foi concluído. Entre em contato com o suporte.
          </p>
        )}

        {ins.kind === "pix" && (
          <div className="mt-6 space-y-5 rounded-[2rem] border border-cinza-suave/40 bg-branco p-6 text-center shadow-card">
            <h2 className="text-lg font-semibold">Pagar com PIX</h2>
            {ins.qrBase64 ? (
              <img
                src={ins.qrBase64}
                alt="QR Code PIX"
                className="mx-auto h-56 w-56 rounded-2xl border border-cinza-suave/30"
              />
            ) : (
              <div className="mx-auto h-56 w-56 rounded-2xl bg-rosa-claro" />
            )}
            {ins.copyPaste && (
              <>
                <p className="text-sm font-medium text-foreground/70">
                  PIX copia e cola
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-2xl bg-rosa-claro/50 px-3 py-3 text-left text-xs break-all text-foreground/80">
                    {ins.copyPaste}
                  </code>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard?.writeText(ins.copyPaste ?? "")}
                    className="shrink-0 rounded-full bg-rosa-claro px-4 py-3 text-xs font-semibold text-rose-gold hover:bg-rosa-blush hover:text-white"
                  >
                    Copiar
                  </button>
                </div>
              </>
            )}
            <p className="text-xs text-foreground/60">
              Concluímos automaticamente assim que o banco confirmar o pagamento.
            </p>
          </div>
        )}

        {ins.kind === "boleto" && (
          <div className="mt-6 space-y-5 rounded-[2rem] border border-cinza-suave/40 bg-branco p-6 shadow-card">
            <h2 className="text-lg font-semibold">Pagar com boleto</h2>
            <p className="text-sm text-foreground/70">
              Vencimento:{" "}
              {ins.boletoDueDate
                ? new Date(ins.boletoDueDate).toLocaleDateString("pt-BR")
                : "em 3 dias úteis"}
            </p>

            {ins.boletoUrl ? (
              <a
                href={ins.boletoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-8 py-3 text-sm font-bold text-white shadow-lg"
              >
                Abrir boleto (PDF)
              </a>
            ) : (
              <>
                {ins.digitableLine && (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-2xl bg-rosa-claro/50 px-3 py-3 text-left text-xs break-all text-foreground/80">
                      {ins.digitableLine}
                    </code>
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard?.writeText(ins.digitableLine ?? "")}
                      className="shrink-0 rounded-full bg-rosa-claro px-4 py-3 text-xs font-semibold text-rose-gold hover:bg-rosa-blush hover:text-white"
                    >
                      Copiar
                    </button>
                  </div>
                )}
                <p className="text-xs text-foreground/60">
                  Use a linha digitável no seu app do banco.
                </p>
              </>
            )}
          </div>
        )}

        {ins.message && ins.status !== "rejected" && (
          <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500">
            {ins.message}
          </p>
        )}

        <div className="mt-6 flex justify-center">
          <Link href="/kits" className="text-sm text-foreground/60 underline-offset-2 hover:text-rose-gold hover:underline">
            Voltar à loja
          </Link>
        </div>
      </div>
    );
  }

  if (order && paid) return null;

  // ---------- formulário ----------
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Finalizar compra</h1>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-cinza-suave/30 pb-4">
        <StepBadge current={step} step={1} label="Identificação" />
        <span className="text-foreground/30">→</span>
        <StepBadge current={step} step={2} label="Endereço" />
        <span className="text-foreground/30">→</span>
        <StepBadge current={step} step={3} label="Pagamento" />
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[1fr_300px] lg:gap-8">
        <div className="space-y-6">
          {/* Passo 1 */}
          {step === 1 && (
            <div className="space-y-4 rounded-[2rem] border border-cinza-suave/40 bg-branco p-6 shadow-card">
              <h2 className="text-lg font-semibold">Quem está comprando?</h2>
              <input
                type="text"
                value={identity.name}
                onChange={(event) => setIdentity((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nome completo"
                className={inputClass}
              />
              <input
                type="email"
                value={identity.email}
                onChange={(event) => setIdentity((current) => ({ ...current, email: event.target.value }))}
                placeholder="E-mail"
                className={inputClass}
              />
              <input
                type="text"
                inputMode="numeric"
                value={identity.cpf}
                onChange={(event) =>
                  setIdentity((current) => ({
                    ...current,
                    cpf: event.target.value.replace(/\D/g, "").slice(0, 11),
                  }))
                }
                placeholder="CPF (para boleto/cartão) — opcional"
                className={inputClass}
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!identityValid}
                  onClick={() => identityValid && setStep(2)}
                  className={cn(
                    "rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-8 py-3 text-sm font-bold text-white shadow-lg",
                    !identityValid && "opacity-40",
                  )}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Passo 2 */}
          {step === 2 && (
            <div className="space-y-4 rounded-[2rem] border border-cinza-suave/40 bg-branco p-6 shadow-card">
              <h2 className="text-lg font-semibold">Endereço de entrega</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={address.cep}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
                    const formatted =
                      digits.length > 5
                        ? `${digits.slice(0, 5)}-${digits.slice(5)}`
                        : digits;
                    setAddress((current) => ({ ...current, cep: formatted }));
                    setCepStatus("idle");
                  }}
                  placeholder="CEP"
                  aria-label="CEP"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => void fillCep(address.cep)}
                  disabled={cepStatus === "loading" || !isCepComplete(address.cep)}
                  className="shrink-0 rounded-full bg-rosa-claro px-5 text-sm font-semibold text-rose-gold hover:bg-rosa-blush hover:text-white disabled:opacity-40"
                >
                  {cepStatus === "loading" ? "..." : "Buscar"}
                </button>
              </div>
              {cepStatus === "error" && (
                <p className="text-xs text-red-400">CEP não encontrado.</p>
              )}
              {cepStatus === "ok" && (
                <p className="text-xs text-emerald-400">
                  Endereço preenchido pelo ViaCEP.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={address.logradouro}
                    onChange={(event) => setAddress((current) => ({ ...current, logradouro: event.target.value }))}
                    placeholder="Rua / Avenida"
                    className={inputClass}
                  />
                </div>
                <input
                  type="text"
                  value={address.numero}
                  onChange={(event) => setAddress((current) => ({ ...current, numero: event.target.value }))}
                  placeholder="Número"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={address.complemento}
                  onChange={(event) => setAddress((current) => ({ ...current, complemento: event.target.value }))}
                  placeholder="Complemento (opcional)"
                  className={inputClass}
                />
                <input
                  type="text"
                  value={address.bairro}
                  onChange={(event) => setAddress((current) => ({ ...current, bairro: event.target.value }))}
                  placeholder="Bairro"
                  className={inputClass}
                />
                <div className="grid grid-cols-[1fr_88px] gap-4">
                  <input
                    type="text"
                    value={address.cidade}
                    onChange={(event) => setAddress((current) => ({ ...current, cidade: event.target.value }))}
                    placeholder="Cidade"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={address.uf}
                    onChange={(event) => setAddress((current) => ({ ...current, uf: event.target.value.toUpperCase().slice(0, 2) }))}
                    placeholder="UF"
                    aria-label="UF"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-foreground/60 underline-offset-2 hover:text-rose-gold hover:underline"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  disabled={!addressValid}
                  onClick={() => addressValid && setStep(3)}
                  className={cn(
                    "rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-8 py-3 text-sm font-bold text-white shadow-lg",
                    !addressValid && "opacity-40",
                  )}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Passo 3 */}
          {step === 3 && (
            <div className="space-y-5 rounded-[2rem] border border-cinza-suave/40 bg-branco p-6 shadow-card">
              <h2 className="text-lg font-semibold">Forma de pagamento</h2>

              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    ["pix", "PIX", "Pagamento imediato adaptado"],
                    ["boleto", "Boleto", "Vencimento em 3 dias"],
                    ["card", "Cartão", "Até 12x sem juros"],
                  ] as [Method, string, string][]
                ).map(([value, label, hint]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMethod(value)}
                    className={cn(
                      "rounded-3xl border p-4 text-left transition-all",
                      method === value
                        ? "border-rose-gold bg-rosa-blush/10 ring-2 ring-rose-gold/40"
                        : "border-cinza-suave/40 hover:border-rose-gold/50",
                    )}
                  >
                    <span className="text-2xl">
                      {value === "pix" ? "⚡" : value === "boleto" ? "📄" : "💳"}
                    </span>
                    <p className="mt-2 text-sm font-bold text-foreground">{label}</p>
                    <p className="mt-0.5 text-[11px] text-foreground/60">{hint}</p>
                  </button>
                ))}
              </div>

              {method === "card" && (
                <CardForm
                  totalCents={totalEstimate}
                  onChange={(fields, valid) => {
                    setCard(fields);
                    setCardValid(valid);
                  }}
                />
              )}

              {method !== "card" && (
                <p className="rounded-2xl bg-rosa-claro/30 p-3 text-xs text-foreground/70">
                  {method === "pix"
                    ? "Após confirmar, você recebe o QR Code e o código copia e cola. O pagamento é aprovado em segundos."
                    : "Geramos o boleto na hora com vencimento em 3 dias úteis."}
                </p>
              )}

              {order && ["approved", "pending"].includes(order.instructions.status) && (
                <p className="text-sm text-emerald-400">Pedido criado com sucesso!</p>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm text-foreground/60 underline-offset-2 hover:text-rose-gold hover:underline"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={() => void finishCheckout()}
                  className={cn(
                    "rounded-full bg-gradient-to-r from-rosa-blush to-rose-gold px-8 py-3 text-sm font-bold text-white shadow-lg",
                    !canSubmit && "opacity-40",
                  )}
                >
                  {submitting ? "Processando..." : "Finalizar pedido"}
                </button>
              </div>

              {submitError && (
                <p className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {submitError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Resumo */}
        <aside className="mt-8 h-fit rounded-[2rem] border border-cinza-suave/40 bg-rosa-claro/20 p-6 lg:mt-0">
          <h2 className="text-base font-bold text-foreground">Resumo do pedido</h2>
          <ul className="mt-4 space-y-3">
            {items.map((line) => {
              const product = getProduct(line.productId);
              if (!product) return null;
              return (
                <li key={line.productId} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-branco">
                    <Image src={product.imageUrl} alt={product.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {product.name}
                    </p>
                    <p className="text-[11px] text-foreground/60">
                      {line.quantity}× {formatPrice(product.priceCents)}
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {formatPrice(product.priceCents * line.quantity)}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 space-y-1.5 border-t border-cinza-suave/30 pt-4 text-sm">
            <div className="flex justify-between text-foreground/70">
              <span>Subtotal</span>
              <span>{formatPrice(subtotalCents)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Cupom {couponState.coupon?.code}</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-foreground/70">
              <span>Frete</span>
              <span>{freight.cents === 0 ? "Grátis" : formatPrice(freight.cents)}</span>
            </div>
            <div className="flex justify-between pt-1 text-base font-bold text-foreground">
              <span>Total</span>
              <span className="text-rose-gold">{formatPrice(totalEstimate)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CheckoutLoading() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-rosa-blush border-t-transparent" />
      <h1 className="mt-6 text-xl font-bold">Aguardando confirmação do pagamento...</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Confirme o pagamento no app do seu banco e volte aqui automaticamente.
      </p>
    </div>
  );
}