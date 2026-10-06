"use client";

import { m as motion, useReducedMotion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { buildTimeline, type TimelineStep } from "@/lib/orders";

/**
 * OrderTimeline — linha do tempo vertical em vidro, compartilhada entre
 * a lista de pedidos (expansão do card) e a página de detalhe.
 */

const STATE_RING: Record<TimelineStep["state"], string> = {
  done: "border-emerald-400/70 bg-emerald-500/15 text-emerald-300",
  current: "border-rose-gold bg-gradient-to-br from-rosa-blush to-rose-gold text-white shadow-[0_0_16px_rgba(224,156,170,0.55)]",
  pending: "border-cinza-suave/60 bg-black/20 text-foreground/40",
  error: "border-red-400/70 bg-red-500/15 text-red-300",
};

const LINE_FILL: Record<TimelineStep["state"], string> = {
  done: "bg-emerald-400/70",
  current: "bg-rose-gold",
  pending: "bg-cinza-suave/50",
  error: "bg-red-400/70",
};

export function OrderTimeline({ order }: { order: Parameters<typeof buildTimeline>[0] }) {
  const steps = buildTimeline(order);
  const reducedMotion = useReducedMotion();

  return (
    <ol className="relative space-y-0" aria-label="Linha do tempo do pedido">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const Icon = step.state === "error" ? AlertCircle : step.icon;
        return (
          <li key={step.key} className="relative flex gap-3 pb-1 last:pb-0">
            <div className="flex flex-col items-center">
              <motion.span
                initial={reducedMotion ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: reducedMotion ? 0 : index * 0.08, type: "spring", stiffness: 320, damping: 22 }}
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${STATE_RING[step.state]}`}
                aria-label={step.label}
              >
                <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden="true" />
              </motion.span>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`my-1 w-px flex-1 min-h-6 ${LINE_FILL[step.state]}`}
                />
              )}
            </div>
            <div className={`pb-6 ${isLast ? "pb-0" : ""} pt-1.5`}>
              <p
                className={`text-sm font-semibold ${
                  step.state === "pending" ? "text-foreground/40" : "text-foreground"
                }`}
              >
                {step.label}
              </p>
              {step.date && (
                <p className="text-xs text-foreground/50">{step.date}</p>
              )}
              {step.state === "error" && (
                <p className="text-xs font-medium text-red-300">
                  {order.status === "cancelado"
                    ? "Pedido cancelado"
                    : "Pagamento não concluído"}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
