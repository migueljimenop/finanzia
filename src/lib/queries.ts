import { Prisma, TxType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { SPEND_ACCOUNTS } from "@/lib/config";

/**
 * Filtro de cuentas que cuentan como "gasto disponible": débito de Santander
 * y Banco de Chile más la tarjeta Falabella (ver src/lib/config.ts).
 */
export function spendAccountFilter(): Prisma.TransactionWhereInput {
  return {
    OR: SPEND_ACCOUNTS.map(({ bank, type }) =>
      type ? { account: { bank, type } } : { account: { bank } }
    ),
  };
}

export function expenseRangeFilter(start: Date, end: Date): Prisma.TransactionWhereInput {
  return { type: TxType.EXPENSE, date: { gte: start, lte: end } };
}

/** Gasto del período en las cuentas relevantes del usuario: base común de
 * margen, forecast, alertas y reportes. */
export function expenseSpendWhere(
  start: Date,
  end: Date,
  userId: string
): Prisma.TransactionWhereInput {
  return { userId, ...expenseRangeFilter(start, end), ...spendAccountFilter() };
}

export async function sumExpenseTotal(start: Date, end: Date, userId: string): Promise<number> {
  const agg = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: expenseSpendWhere(start, end, userId),
  });
  return Number(agg._sum.amount ?? 0);
}

export async function sumExpenseByCategory(
  start: Date,
  end: Date,
  userId: string
): Promise<Map<string | null, number>> {
  const results = await prisma.transaction.groupBy({
    by: ["categoryId"],
    _sum: { amount: true },
    where: expenseSpendWhere(start, end, userId),
  });
  return new Map(results.map((r) => [r.categoryId, Number(r._sum.amount ?? 0)]));
}

export async function sumExpenseByCategoryWithNames(start: Date, end: Date, userId: string) {
  const results = await prisma.transaction.groupBy({
    by: ["categoryId"],
    _sum: { amount: true },
    where: expenseSpendWhere(start, end, userId),
  });

  const categoryIds = results.map((r) => r.categoryId).filter((id): id is string => id !== null);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds }, userId },
  });
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return results
    .map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryId
        ? (categoryById.get(r.categoryId)?.name ?? "Categoría eliminada")
        : "Sin categoría",
      amount: Number(r._sum.amount ?? 0),
    }))
    .sort((a, b) => b.amount - a.amount);
}

export async function sumExpenseByAccount(start: Date, end: Date, userId: string) {
  const results = await prisma.transaction.groupBy({
    by: ["accountId"],
    _sum: { amount: true },
    where: expenseSpendWhere(start, end, userId),
  });

  const accounts = await prisma.account.findMany({
    where: { id: { in: results.map((r) => r.accountId) }, userId },
  });
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  return results
    .map((r) => ({
      accountId: r.accountId,
      accountName: accountById.get(r.accountId)?.name ?? "Cuenta eliminada",
      bank: accountById.get(r.accountId)?.bank ?? null,
      amount: Number(r._sum.amount ?? 0),
    }))
    .sort((a, b) => b.amount - a.amount);
}