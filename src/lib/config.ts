import { AccountType, Bank } from "@/generated/prisma/client";

/**
 * Cuentas cuyo gasto se considera "gasto disponible" y por lo tanto sale del
 * margen, alimenta el forecast y las alertas de gasto hormiga.
 *
 * - Débito de Santander y Banco de Chile: el margen disponible está ahí.
 * - Tarjeta Falabella: decisión tomada para que su sobreconsumo también cuente.
 * - Mercado Pago queda fuera: ese dinero ya está asignado al sobre "hogar" al
 *   distribuir el sueldo.
 */
export type SpendAccountScope = { bank: Bank; type?: AccountType };

export const SPEND_ACCOUNTS: SpendAccountScope[] = [
  { bank: Bank.SANTANDER, type: AccountType.DEBIT },
  { bank: Bank.BANCO_CHILE, type: AccountType.DEBIT },
  { bank: Bank.FALABELLA },
];

/** Umbrales de las alertas de gasto hormiga (ver src/lib/alerts.ts). */
export const ALERT_MIN_MONTHS_REQUIRED = 2;
export const ALERT_DEVIATION_THRESHOLD = 0.2; // 20% sobre el promedio histórico
export const ALERT_MIN_AMOUNT_TO_FLAG = 5000; // CLP
export const ALERT_MONTHS_OF_HISTORY = 3;

/** Cuántos meses se comparan en el reporte mensual. */
export const REPORT_COMPARISON_MONTHS = 6;