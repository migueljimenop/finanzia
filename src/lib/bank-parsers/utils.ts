import { parseFlexibleDate } from "@/lib/date";
import { parseFlexibleAmount } from "@/lib/csv";
import type { SheetRow } from "./types";

/** Texto normalizado (minúsculas, recortado) para comparar contra encabezados. */
export function cellToText(cell: unknown): string {
  if (cell == null) return "";
  return String(cell).trim().toLowerCase();
}

/** Texto tal cual, solo recortado, para valores que sí se muestran al usuario. */
export function cellToString(cell: unknown): string {
  if (cell == null) return "";
  return String(cell).trim();
}

export function parseCellDate(cell: unknown): Date | null {
  if (cell instanceof Date) return cell;
  if (typeof cell === "string") return parseFlexibleDate(cell);
  return null;
}

export function parseCellAmount(cell: unknown): number | null {
  if (typeof cell === "number") return Number.isFinite(cell) ? Math.abs(cell) : null;
  if (typeof cell === "string" && cell.trim() !== "") return parseFlexibleAmount(cell);
  return null;
}

/**
 * Busca un número de cuenta/tarjeta en la metadata de la cartola (fuera de
 * la tabla de movimientos). `labelRegex` puede capturar el valor inline en
 * el mismo celda (grupo 1, ej. "Cuenta Corriente: 0-000-76-32920-6"), o
 * matchear solo la etiqueta (ej. "Cuenta:") y el valor se busca en la
 * siguiente celda no vacía de la misma fila.
 */
export function findAccountNumber(
  rows: SheetRow[],
  labelRegex: RegExp,
  searchLimit = 20
): string | null {
  const limit = Math.min(rows.length, searchLimit);

  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    for (let j = 0; j < row.length; j++) {
      const cell = cellToString(row[j]);
      const match = cell.match(labelRegex);
      if (!match) continue;
      if (match[1]) return match[1].trim();

      for (let k = j + 1; k < row.length; k++) {
        const next = cellToString(row[k]);
        if (next) return next;
      }
    }
  }

  return null;
}

/**
 * Busca, dentro de las primeras `searchLimit` filas, una fila cuyas celdas
 * contengan todos los `requiredSubstrings` (cada uno en una celda distinta).
 * Las cartolas bancarias suelen traer varias filas de metadata antes de la
 * tabla real, así que el encabezado no siempre está en la fila 1.
 */
export function findHeaderRow(
  rows: SheetRow[],
  requiredSubstrings: string[],
  searchLimit = 50
): { rowIndex: number; columnIndex: Record<string, number> } | null {
  const limit = Math.min(rows.length, searchLimit);

  for (let i = 0; i < limit; i++) {
    const texts = rows[i].map(cellToText);
    const allFound = requiredSubstrings.every((needle) => texts.some((t) => t.includes(needle)));
    if (!allFound) continue;

    const columnIndex: Record<string, number> = {};
    for (const needle of requiredSubstrings) {
      columnIndex[needle] = texts.findIndex((t) => t.includes(needle));
    }
    return { rowIndex: i, columnIndex };
  }

  return null;
}
