import { Bank, TxType } from "@/generated/prisma/enums";
import type { BankParser, BankParseResult, ParsedMovement } from "./types";
import { cellToString, findHeaderRow, parseCellAmount, parseCellDate } from "./utils";

const ID = "falabella";
const LABEL = "Falabella (tarjeta de crédito)";

/**
 * Cartola de tarjeta de crédito Falabella (sin cuenta corriente asociada):
 * encabezado "FECHA | DESCRIPCION | TITULAR/ADICIONAL | MONTO | CUOTAS
 * PENDIENTES | VALOR CUOTA". Fecha viene como fecha real (no texto). MONTO
 * siempre es positivo; el signo de uso está en la descripción: las filas
 * "PAGO ..." son abonos a la tarjeta (no gasto propio), el resto son
 * compras.
 */
export const falabellaParser: BankParser = {
  id: ID,
  label: LABEL,
  bank: Bank.FALABELLA,
  parse(rows): BankParseResult | null {
    const header = findHeaderRow(rows, ["fecha", "descripcion", "titular", "monto"]);
    if (!header) return null;

    const { rowIndex, columnIndex } = header;
    const movements: ParsedMovement[] = [];
    let skippedRows = 0;

    for (let i = rowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      const date = parseCellDate(row[columnIndex["fecha"]]);
      if (!date) break;

      const amount = parseCellAmount(row[columnIndex["monto"]]);
      const description = cellToString(row[columnIndex["descripcion"]]);

      if (!amount) {
        skippedRows++;
        continue;
      }

      const isPayment = /^pago/i.test(description);
      movements.push({
        date,
        amount,
        description,
        type: isPayment ? TxType.TRANSFER : TxType.EXPENSE,
      });
    }

    return { bankId: ID, bankLabel: LABEL, bank: Bank.FALABELLA, movements, skippedRows };
  },
};
