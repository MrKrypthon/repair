import { randomInt } from 'crypto';

/**
 * Folios se muestran a clientes (recibos, seguimiento público, PDFs), así que se mantienen
 * cortos y numéricos. El sufijo aleatorio evita colisiones cuando dos folios con el mismo
 * prefijo se generan dentro de la misma ventana de 6 dígitos del timestamp (cada ~16.7 min).
 */
export function generateFolio(prefix: string): string {
  const time = Date.now().toString().slice(-6);
  const random = randomInt(0, 100).toString().padStart(2, '0');
  return `${prefix}-${time}${random}`;
}
