import type { BankParseResult, SheetRow } from "./types";
import { santanderParser } from "./santander";
import { bancoDeChileParser } from "./banco-de-chile";
import { falabellaParser } from "./falabella";

export const BANK_PARSERS = [santanderParser, bancoDeChileParser, falabellaParser];

/** Prueba cada parser conocido; devuelve el primero que reconozca el formato. */
export function detectBankFormat(rows: SheetRow[]): BankParseResult | null {
  for (const parser of BANK_PARSERS) {
    const result = parser.parse(rows);
    if (result && result.movements.length > 0) return result;
  }
  return null;
}

export type { BankParseResult, BankParser, ParsedMovement, SheetRow } from "./types";
