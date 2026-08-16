import { Bank, TxType } from "@/generated/prisma/enums";
import type { BankParser, BankParseResult, ParsedMovement } from "./types";
import { cellToString, findAccountNumber, findHeaderRow, parseCellAmount, parseCellDate } from "./utils";

const ID = "santander";
const LABEL = "Santander (cuenta corriente / débito)";

/**
 * Cartola de cuenta corriente Santander: dos filas de metadata (titular,
 * N° de cuenta), luego encabezado "Fecha | Detalle | Monto cargo ($) |
 * Monto abono ($) | Saldo ($)". Fecha viene como texto "DD-MM-YYYY".
 * Cargo = gasto, abono = ingreso.
 */
export const santanderParser: BankParser = {
  id: ID,
  label: LABEL,
  bank: Bank.SANTANDER,
  parse(rows): BankParseResult | null {
    const header = findHeaderRow(rows, ["fecha", "detalle", "monto cargo", "monto abono"]);
    if (!header) return null;

    const { rowIndex, columnIndex } = header;
    const accountNumber = findAccountNumber(rows, /cuenta\s+corriente\s*:?\s*([\d-]+)/i);
    const movements: ParsedMovement[] = [];
    let skippedRows = 0;

    for (let i = rowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      const date = parseCellDate(row[columnIndex["fecha"]]);
      if (!date) break;

      const cargo = parseCellAmount(row[columnIndex["monto cargo"]]);
      const abono = parseCellAmount(row[columnIndex["monto abono"]]);
      const description = cellToString(row[columnIndex["detalle"]]);

      if (cargo) {
        movements.push({ date, amount: cargo, description, type: TxType.EXPENSE });
      } else if (abono) {
        movements.push({ date, amount: abono, description, type: TxType.INCOME });
      } else {
        skippedRows++;
      }
    }

    return { bankId: ID, bankLabel: LABEL, bank: Bank.SANTANDER, accountNumber, movements, skippedRows };
  },
};
