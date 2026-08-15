import { Bank, TxType } from "@/generated/prisma/enums";

/** Una hoja ya normalizada a arreglo de filas, cada fila un arreglo de celdas. */
export type SheetRow = unknown[];

export type ParsedMovement = {
  date: Date;
  amount: number;
  description: string;
  type: TxType;
};

export type BankParseResult = {
  bankId: string;
  bankLabel: string;
  /** Banco del enum de Prisma, para preseleccionar la cuenta destino. */
  bank: Bank;
  movements: ParsedMovement[];
  /** Filas dentro de la tabla detectada que no se pudieron interpretar. */
  skippedRows: number;
};

export type BankParser = {
  id: string;
  label: string;
  /** Banco del enum de Prisma, para preseleccionar la cuenta destino. */
  bank: Bank;
  /** Devuelve null si esta hoja no calza con el formato de este banco. */
  parse(rows: SheetRow[]): BankParseResult | null;
};
