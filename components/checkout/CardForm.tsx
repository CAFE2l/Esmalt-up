"use client";

import { useMemo, useState } from "react";
import { getInstallments, formatInstallment } from "@/lib/catalogData";

export interface CardFields {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
  installments: number;
}

const BRAND_HINTS: Record<string, string> = {
  "4": "visa",
  "5": "mastercard",
  "34": "amex",
  "37": "amex",
  "6": "elo",
};

export function detectBrand(number: string): string | null {
  const digits = number.replace(/\D/g, "");
  return BRAND_HINTS[(digits[0] ?? "") + (digits[1] ?? "")] ?? BRAND_HINTS[digits[0] ?? ""] ?? null;
}

function luhnValid(digits: string): boolean {
  if (!/^\d{15,16}$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 4) parts.push(digits.slice(i, i + 4));
  return parts.join(" ");
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

const inputClass =
  "w-full rounded-full border border-cinza-suave/50 bg-branco px-4 py-3 text-sm text-foreground outline-none placeholder:text-foreground/40 focus:border-rosa-blush";

export default function CardForm({
  totalCents,
  onChange,
}: {
  totalCents: number;
  onChange: (fields: CardFields, valid: boolean) => void;
}) {
  const [fields, setFields] = useState<CardFields>({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
    installments: 1,
  });

  const installments = useMemo(() => getInstallments(Math.max(totalCents, 1000)), [totalCents]);

  const valid = useMemo(() => {
    const digits = fields.number.replace(/\D/g, "");
    return (
      digits.length >= 15 &&
      luhnValid(digits) &&
      fields.name.trim().length >= 5 &&
      /^\d{2}\/\d{2}$/.test(fields.expiry) &&
      /^\d{3,4}$/.test(fields.cvv)
    );
  }, [fields]);

  const set = (patch: Partial<CardFields>) => {
    const next = { ...fields, ...patch };
    setFields(next);
    onChange(next, valid);
  };

  const brand = detectBrand(fields.number);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Dados do cartão</p>
        {brand && (
          <span className="rounded-full bg-rosa-claro px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-gold">
            {brand}
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={fields.number}
          onChange={(event) => set({ number: formatCardNumber(event.target.value) })}
          placeholder="Número do cartão"
          aria-label="Número do cartão"
          className={`${inputClass} pr-12`}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wide text-rosa-blush">
          seguro
        </span>
      </div>

      <input
        type="text"
        value={fields.name}
        onChange={(event) => set({ name: event.target.value.toUpperCase() })}
        placeholder="Nome impresso no cartão"
        aria-label="Nome impresso no cartão"
        className={inputClass}
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          inputMode="numeric"
          value={fields.expiry}
          onChange={(event) => set({ expiry: formatExpiry(event.target.value) })}
          placeholder="MM/AA"
          aria-label="Validade"
          className={inputClass}
        />
        <input
          type="text"
          inputMode="numeric"
          value={fields.cvv}
          onChange={(event) =>
            set({ cvv: event.target.value.replace(/\D/g, "").slice(0, 4) })
          }
          placeholder="CVV"
          aria-label="Código de segurança"
          className={inputClass}
        />
      </div>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-foreground/70">
          Parcelamento sem juros
        </span>
        <select
          value={fields.installments}
          onChange={(event) => set({ installments: Number(event.target.value) })}
          className="w-full cursor-pointer rounded-full border border-cinza-suave/50 bg-branco px-4 py-3 text-sm text-foreground outline-none focus:border-rosa-blush"
        >
          {Array.from(
            { length: Math.max(1, installments.maxInstallments) },
            (_, i) => i + 1,
          ).map((n) => (
            <option key={n} value={n}>
              {n}x de {formatInstallment(totalCents / n)} sem juros
            </option>
          ))}
        </select>
      </label>

      <p className="text-xs text-foreground/50">
        Seus dados são processados com criptografia. O cartão nunca é
        armazenado pela Esmalt&apos;up.
      </p>
    </div>
  );
}