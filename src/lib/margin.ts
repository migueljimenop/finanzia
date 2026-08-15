import { prisma } from "@/lib/prisma";
import { AccountType, Bank, BucketType, TxType } from "@/generated/prisma/client";

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
 * Cuentas débito cuyo gasto sale del margen disponible. Mercado Pago queda
 * fuera porque ese dinero ya está asignado al sobre "hogar" al momento de
 * la distribución del sueldo.
 */
const MARGIN_DEBIT_BANKS: Bank[] = [Bank.SANTANDER, Bank.BANCO_CHILE];

export async function getMarginSummary(reference: Date = new Date()) {
  const { start, end } = getMonthRange(reference);

  const marginAgg = await prisma.incomeDistribution.aggregate({
    _sum: { amount: true },
    where: {
      type: BucketType.AVAILABLE_MARGIN,
      income: { date: { gte: start, lte: end } },
    },
  });

  const spentAgg = await prisma.transaction.aggregate({
    _sum: { amount: true },
    where: {
      type: TxType.EXPENSE,
      date: { gte: start, lte: end },
      account: { bank: { in: MARGIN_DEBIT_BANKS }, type: AccountType.DEBIT },
    },
  });

  const monthlyMargin = Number(marginAgg._sum.amount ?? 0);
  const spent = Number(spentAgg._sum.amount ?? 0);
  const remaining = monthlyMargin - spent;
  const daysRemaining = getDaysRemaining(reference, end);
  const dailyAvailable = remaining / daysRemaining;

  return { monthlyMargin, spent, remaining, daysRemaining, dailyAvailable };
}

export async function getBucketBreakdown(reference: Date = new Date()) {
  const { start, end } = getMonthRange(reference);

  const results = await prisma.incomeDistribution.groupBy({
    by: ["type"],
    _sum: { amount: true },
    where: { income: { date: { gte: start, lte: end } } },
  });

  return results.map((r) => ({ type: r.type, amount: Number(r._sum.amount ?? 0) }));
}

export async function getConsolidatedBalance() {
  const agg = await prisma.account.aggregate({ _sum: { balance: true } });
  return Number(agg._sum.balance ?? 0);
}
