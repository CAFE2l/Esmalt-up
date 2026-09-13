/**
 * Cálculo de frete (placeholder da integração com Correios / Melhor Envio)
 * e busca automática de endereço via ViaCEP (API pública, sem chave).
 */

export interface CepAddress {
  cep: string;
  logradouro: string | null;
  bairro: string | null;
  localidade: string | null;
  uf: string | null;
  complemento: string | null;
}

export interface FreightOption {
  method: "padrao" | "rapido" | "gratis";
  label: string;
  etaDays: string;
  cents: number;
}

const FREE_SHIPPING_CENTS = 9900;
const BASE_PADRAO_CENTS = 1490;
const PER_ITEM_PADRAO_CENTS = 350;
const BASE_RAPIDO_CENTS = 2990;
const PER_ITEM_RAPIDO_CENTS = 550;

export function cleanCep(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function isCepComplete(value: string): boolean {
  return cleanCep(value).length === 8;
}

export async function lookupCep(cep: string): Promise<CepAddress | null> {
  const digits = cleanCep(cep);
  if (!isCepComplete(digits)) return null;
  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${digits}/json/`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data.erro) return null;
    return {
      cep: data.cep,
      logradouro: data.logradouro || null,
      bairro: data.bairro || null,
      localidade: data.localidade || null,
      uf: data.uf || null,
      complemento: data.complemento || null,
    };
  } catch {
    return null;
  }
}

/**
 * Placeholder de preço de frete. Quando a integração real (Correios/Melhor
 * Envio) estiver ativa, substitua por uma chamada às APIs de cotação.
 */
export function calculateFreight({
  subtotalCents,
  itemCount,
}: {
  subtotalCents: number;
  itemCount: number;
}): FreightOption {
  if (subtotalCents >= FREE_SHIPPING_CENTS) {
    return {
      method: "gratis",
      label: "Frete grátis",
      etaDays: "5 a 10 dias úteis",
      cents: 0,
    };
  }
  return {
    method: "padrao",
    label: "Entrega padrão (Correios)",
    etaDays: "5 a 10 dias úteis",
    cents: BASE_PADRAO_CENTS + PER_ITEM_PADRAO_CENTS * Math.max(1, itemCount),
  };
}

export function freeShippingThresholdCents(): number {
  return FREE_SHIPPING_CENTS;
}

export function calculateRapidoFreight(itemCount: number): FreightOption {
  return {
    method: "rapido",
    label: "Entrega rápida (Melhor Envio)",
    etaDays: "2 a 4 dias úteis",
    cents: BASE_RAPIDO_CENTS + PER_ITEM_RAPIDO_CENTS * Math.max(1, itemCount),
  };
}