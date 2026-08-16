import { Bank, TxType } from "@/generated/prisma/enums";
import type { BankParser, BankParseResult, ParsedMovement } from "./types";
import { cellToString, findAccountNumber, findHeaderRow, parseCellAmount, parseCellDate } from "./utils";

const ID = "banco_chile";
const LABEL = "Banco de Chile (cuenta vista / FAN)";

/**
 * Cartola de cuenta vista/FAN Banco de Chile: muchas filas de metadata
 * (titular, RUT, N° de cuenta, saldos) antes del encabezado real "Fecha |
 * Descripción | Canal o Sucursal | Cargos (CLP) | Abonos (CLP) | Saldo
 * (CLP)". Fecha viene como texto "DD/MM/YYYY". Cargo = gasto, abono =
 * ingreso. Después de la tabla vienen filas vacías y un disclaimer, por
 * eso se corta apenas una fila no trae una fecha válida en su columna.
 */
export const bancoDeChileParser: BankParser = {
  id: ID,
  label: LABEL,
  bank: Bank.BANCO_CHILE,
  parse(rows): BankParseResult | null {
    const header = findHeaderRow(rows, ["fecha", "descripci", "cargos", "abonos"]);
    if (!header) return null;

    const { rowIndex, columnIndex } = header;
    const accountNumber = findAccountNumber(rows, /^cuenta:?$/i);
    const movements: ParsedMovement[] = [];
    let skippedRows = 0;

    for (let i = rowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      const date = parseCellDate(row[columnIndex["fecha"]]);
      if (!date) break;

      const cargo = parseCellAmount(row[columnIndex["cargos"]]);
      const abono = parseCellAmount(row[columnIndex["abonos"]]);
      const description = cellToString(row[columnIndex["descripci"]]);

      if (cargo) {
        movements.push({ date, amount: cargo, description, type: TxType.EXPENSE });
      } else if (abono) {
        movements.push({ date, amount: abono, description, type: TxType.INCOME });
      } else {
        skippedRows++;
      }
    }

    return {
      bankId: ID,
      bankLabel: LABEL,
      bank: Bank.BANCO_CHILE,
      accountNumber,
      movements,
      skippedRows,
    };
  },
};
