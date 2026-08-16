import { prisma } from "@/lib/prisma";
import { BucketType } from "@/generated/prisma/client";
import { sumExpenseTotal } from "@/lib/queries";

export function getMonthRange(reference: Date) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function getDaysRemaining(reference: Date, monthEnd: Date) {
  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const lastDay = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(Math.round((lastDay.getTime() - today.getTime()) / msPerDay) + 1, 1);
}

/**
 * Cuentas cuyo gasto sale del margen disponible, el forecast y las alertas.
 * Definidas en src/lib/config.ts (incluye débito Santander/Banco de Chile y
 * la tarjeta Falabella; Mercado Pago queda fuera).
 */

export async function getMarginSummary(userId: string, reference: Date = new Date()) {
  const { start, end } = getMonthRange(reference);

  const marginAgg = await prisma.incomeDistribution.aggregate({
    _sum: { amount: true },
    where: {
      type: BucketType.AVAILABLE_MARGIN,
      income: { userId, date: { gte: start, lte: end } },
    },
  });

  const spent = await sumExpenseTotal(start, end, userId);

  const monthlyMargin = Number(marginAgg._sum.amount ?? 0);
  const remaining = monthlyMargin - spent;
  const daysRemaining = getDaysRemaining(reference, end);
  const dailyAvailable = remaining / daysRemaining;

  return { monthlyMargin, spent, remaining, daysRemaining, dailyAvailable };
}

export async function getBucketBreakdown(userId: string, reference: Date = new Date()) {
  const { start, end } = getMonthRange(reference);

  const results = await prisma.incomeDistribution.groupBy({
    by: ["type"],
    _sum: { amount: true },
    where: { income: { userId, date: { gte: start, lte: end } } },
  });

  return results.map((r) => ({ type: r.type, amount: Number(r._sum.amount ?? 0) }));
}

export async function getConsolidatedBalance(userId: string) {
  const agg = await prisma.account.aggregate({ _sum: { balance: true }, where: { userId } });
  return Number(agg._sum.balance ?? 0);
}
