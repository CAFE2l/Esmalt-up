import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  findBuiltInCoupon,
  normalizeCouponCode,
  type AppliedCoupon,
} from "@/lib/coupons";

export const runtime = "nodejs";

const applySchema = z.object({
  code: z.string().min(1),
  subtotalCents: z.number().int().min(0).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Cupom inválido." }, { status: 400 });
    }

    const code = normalizeCouponCode(parsed.data.code);

    // 1) Cupom cadastrado no banco.
    const dbCoupon = await prisma.coupon.findUnique({ where: { code } });

    if (dbCoupon) {
      const now = new Date();
      if (!dbCoupon.active || (dbCoupon.expiresAt && dbCoupon.expiresAt < now)) {
        return NextResponse.json(
          { error: "Cupom expirado ou inativo." },
          { status: 404 },
        );
      }
      const subtotal = parsed.data.subtotalCents ?? 0;
      if (
        dbCoupon.minPriceCents != null &&
        subtotal > 0 &&
        subtotal < dbCoupon.minPriceCents
      ) {
        return NextResponse.json(
          {
            error: `Cupom válido para pedidos acima de ${(dbCoupon.minPriceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
          },
          { status: 400 },
        );
      }

      const coupon: AppliedCoupon =
        dbCoupon.type === "percent"
          ? {
              code: dbCoupon.code,
              type: "percent",
              value: dbCoupon.value,
              label: `${dbCoupon.value}% de desconto`,
            }
          : {
              code: dbCoupon.code,
              type: "fixed",
              value: dbCoupon.value,
              label: `${(dbCoupon.value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} de desconto`,
            };
      return NextResponse.json({ coupon });
    }

    // 2) Fallback para a lista embutida (ambiente sem seed no banco).
    const builtIn = findBuiltInCoupon(code);
    if (builtIn) {
      return NextResponse.json({ coupon: builtIn });
    }

    return NextResponse.json(
      { error: "Cupom não encontrado." },
      { status: 404 },
    );
  } catch (error) {
    console.error("[api/coupons/apply] POST", error);
    return NextResponse.json(
      { error: "Não foi possível validar o cupom." },
      { status: 500 },
    );
  }
}