/**
 * Lightweight QR Code generation utility
 * Uses a simple URL-based approach to avoid dependencies
 */

export interface QRCodeOptions {
  text: string;
  size?: number;
  backgroundColor?: string;
  foregroundColor?: string;
}

/**
 * Get QR code image URL from a reliable external service
 * This avoids adding heavy dependencies to the project
 */
export function getQRCodeImageURL(text: string, size: number = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
}

/**
 * Create QR code image element
 */
export function createQRCodeImage(text: string, size: number = 200): HTMLImageElement {
  const img = document.createElement("img");
  img.src = getQRCodeImageURL(text, size);
  img.alt = "Código QR de verificação";
  img.width = size;
  img.height = size;
  return img;
}
