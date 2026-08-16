import { prisma } from "@/lib/prisma";
import { TxType } from "@/generated/prisma/client";
import { getMonthRange } from "@/lib/margin";

export async function getSpendByAccount(reference: Date = new Date()) {
  const { start, end } = getMonthRange(reference);

  const results = await prisma.transaction.groupBy({
    by: ["accountId"],
    _sum: { amount: true },
    where: { type: TxType.EXPENSE, date: { gte: start, lte: end } },
  });

  const accounts = await prisma.account.findMany({
    where: { id: { in: results.map((r) => r.accountId) } },
  });
  const accountById = new Map(accounts.map((a) => [a.id, a]));

  return results
    .map((r) => {
      const account = accountById.get(r.accountId);
      return {
        accountId: r.accountId,
        accountName: account?.name ?? "Cuenta eliminada",
        bank: account?.bank ?? null,
        amount: Number(r._sum.amount ?? 0),
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export async function getSpendByCategory(reference: Date = new Date()) {
  const { start, end } = getMonthRange(reference);

  const results = await prisma.transaction.groupBy({
    by: ["categoryId"],
    _sum: { amount: true },
    where: { type: TxType.EXPENSE, date: { gte: start, lte: end } },
  });

  const categoryIds = results.map((r) => r.categoryId).filter((id): id is string => id !== null);
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return results
    .map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryId ? (categoryById.get(r.categoryId)?.name ?? "Categoría eliminada") : "Sin categoría",
      amount: Number(r._sum.amount ?? 0),
    }))
    .sort((a, b) => b.amount - a.amount);
}

export async function getMonthlyComparison(reference: Date = new Date(), monthsBack = 6) {
  const months: { label: string; amount: number }[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthDate = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const { start, end } = getMonthRange(monthDate);

    const agg = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: TxType.EXPENSE, date: { gte: start, lte: end } },
    });

    months.push({
      label: monthDate.toLocaleDateString("es-CL", { month: "short", year: "2-digit" }),
      amount: Number(agg._sum.amount ?? 0),
    });
  }

  return months;
}
