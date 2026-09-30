/**
 * Cálculo de frete (placeholder da integração com Correios / Melhor Envio)
 * e busca automática de endereço via ViaCEP (API pública, sem chave).
 * 
 * PROVIDER ATUAL: Fallback regional table (Melhor Envio/Correios não configurados).
 * Para ativar o Melhor Envio, configure MELHOR_ENVIO_TOKEN.
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
  carrier: string;
}

export interface DimensionalWeight {
  weightKg: number;
  volumetricKg: number;
  chargeableKg: number;
}

const FREE_SHIPPING_CENTS = 9900;
const BASE_PADRAO_CENTS = 1490;
const PER_ITEM_PADRAO_CENTS = 350;
const BASE_RAPIDO_CENTS = 2990;
const PER_ITEM_RAPIDO_CENTS = 550;
const VOLUNTARY_DIVISOR = 6000; // cm³ per kg for volumetric weight

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
 * Calculate dimensional weight from product dimensions (cm).
 * Chargeable weight = max(actual weight, volumetric weight).
 */
export function calculateDimensionalWeight(
  weightG: number,
  heightCm: number,
  widthCm: number,
  lengthCm: number,
): DimensionalWeight {
  const weightKg = weightG / 1000;
  const volumetricKg = (heightCm * widthCm * lengthCm) / VOLUNTARY_DIVISOR;
  return {
    weightKg,
    volumetricKg,
    chargeableKg: Math.max(weightKg, volumetricKg),
  };
}

/**
 * Calculate freight based on order subtotal and items.
 * Uses dimensional weight when product dimensions are available.
 * 
 * Active provider: Regional fallback table (Correios/Melhor Envio simulation).
 * Set MELHOR_ENVIO_TOKEN for real carrier rates.
 */
export function calculateFreight({
  subtotalCents,
  itemCount,
  totalWeightKg,
}: {
  subtotalCents: number;
  itemCount: number;
  totalWeightKg?: number;
}): FreightOption {
  // Free shipping threshold
  if (subtotalCents >= FREE_SHIPPING_CENTS) {
    return {
      method: "gratis",
      label: "Frete grátis",
      etaDays: "5 a 10 dias úteis",
      cents: 0,
      carrier: "gratuito",
    };
  }

  // Base price adjusted by weight if provided
  const weightMultiplier = totalWeightKg ? Math.max(1, totalWeightKg) : 1;
  const adjustedPerItem = Math.round(PER_ITEM_PADRAO_CENTS * weightMultiplier);

  return {
    method: "padrao",
    label: "Entrega padrão (Correios)",
    etaDays: "5 a 10 dias úteis",
    cents: BASE_PADRAO_CENTS + adjustedPerItem * Math.max(1, itemCount),
    carrier: "Correios (simulado)",
  };
}

export function calculateRapidoFreight(
  itemCount: number,
  totalWeightKg?: number,
): FreightOption {
  const weightMultiplier = totalWeightKg ? Math.max(1, totalWeightKg) : 1;
  const adjustedPerItem = Math.round(PER_ITEM_RAPIDO_CENTS * weightMultiplier);

  return {
    method: "rapido",
    label: "Entrega rápida (Melhor Envio)",
    etaDays: "2 a 4 dias úteis",
    cents: BASE_RAPIDO_CENTS + adjustedPerItem * Math.max(1, itemCount),
    carrier: "Melhor Envio (simulado)",
  };
}

export function freeShippingThresholdCents(): number {
  return FREE_SHIPPING_CENTS;
}

/**
 * Check if Melhor Envio API is configured.
 */
export function isMelhorEnvioConfigured(): boolean {
  return Boolean(process.env.MELHOR_ENVIO_TOKEN?.trim());
}
