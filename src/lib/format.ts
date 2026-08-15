const clpFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatCLP(amount: number | string | { toString(): string }): string {
  return clpFormatter.format(Number(amount.toString()));
}

export const BANK_LABELS: Record<string, string> = {
  SANTANDER: "Santander",
  FALABELLA: "Falabella",
  MERCADO_PAGO: "Mercado Pago",
  BANCO_CHILE: "Banco de Chile",
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  DEBIT: "Débito",
  CREDIT: "Crédito",
};

export const BUCKET_TYPE_LABELS: Record<string, string> = {
  INVESTMENT: "Inversión",
  HOME_TRANSFER: "Hogar (Mercado Pago)",
  CREDIT_INSTALLMENT: "Cuota de crédito",
  AVAILABLE_MARGIN: "Margen de gasto",
};

export const CALC_METHOD_LABELS: Record<string, string> = {
  PERCENTAGE: "Porcentaje",
  FIXED_AMOUNT: "Monto fijo",
  REMAINDER: "Resto",
};

export const TX_TYPE_LABELS: Record<string, string> = {
  EXPENSE: "Gasto",
  INCOME: "Ingreso",
  TRANSFER: "Transferencia",
};

export const TX_SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  IMPORT: "Importado",
};
