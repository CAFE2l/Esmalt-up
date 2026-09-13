/**
 * Cupons de desconto.
 *
 * A resolução oficial acontece no banco (tabela `coupons`) via `/api/coupons`.
 * A lista abaixo garante um fallback funcional em ambientes sem seed.
 */

export interface AppliedCoupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  label: string;
}

export const BUILT_IN_COUPONS: AppliedCoupon[] = [
  { code: "WELCOME10", type: "percent", value: 10, label: "10% de boas-vindas" },
  { code: "FRETE15", type: "fixed", value: 1500, label: "R$ 15 de desconto" },
];

export function findBuiltInCoupon(code: string): AppliedCoupon | null {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const coupon = BUILT_IN_COUPONS.find((item) => item.code === normalized);
  return coupon ?? null;
}

export function couponDiscountCents(
  coupon: AppliedCoupon,
  subtotalCents: number,
): number {
  if (coupon.type === "percent") {
    return Math.round((subtotalCents * coupon.value) / 100);
  }
  return Math.min(coupon.value, subtotalCents);
}

export function normalizeCouponCode(code?: string | null): string {
  return (code ?? "").trim().toUpperCase();
}