import { prisma } from "@/lib/prisma";
import { TxType } from "@/generated/prisma/client";
import { getMonthRange } from "@/lib/margin";

export type AnthillAlert = {
  categoryId: string | null;
  categoryName: string;
  currentSpend: number;
  historicalAverage: number;
  deviationPct: number;
};

export type AnthillReport = {
  hasEnoughHistory: boolean;
  monthsOfHistory: number;
  daysCompared: number;
  overall: AnthillAlert | null;
  alerts: AnthillAlert[];
};

const MIN_MONTHS_REQUIRED = 2;
const DEVIATION_THRESHOLD = 0.2;
const MIN_AMOUNT_TO_FLAG = 5000;

/**
 * Compara el gasto acumulado del mes (hasta hoy) contra el promedio de esos
 * mismos días en los `monthsOfHistory` meses anteriores, por categoría y en
 * total. Marca como alerta cuando el gasto actual supera el promedio
 * histórico en más de `DEVIATION_THRESHOLD`.
 */
export async function getAnthillReport(
  reference: Date = new Date(),
  monthsOfHistory = 3
): Promise<AnthillReport> {
  const { start } = getMonthRange(reference);
  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const daysElapsed = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const currentEnd = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
    23,
    59,
    59,
    999
  );

  const currentByCategory = await sumByCategory(start, currentEnd);

  const historicalByMonth: Map<string | null, number>[] = [];
  for (let i = 1; i <= monthsOfHistory; i++) {
    const monthDate = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const lastDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const cappedDay = Math.min(daysElapsed, lastDayOfMonth);
    const monthEnd = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      cappedDay,
      23,
      59,
      59,
      999
    );

    const monthTotals = await sumByCategory(monthStart, monthEnd);
    // Un mes sin ningún movimiento no cuenta como historial real, solo como
    // un mes calendario vacío.
    if (monthTotals.size > 0) historicalByMonth.push(monthTotals);
  }

  const monthsWithData = historicalByMonth.length;
  const hasEnoughHistory = monthsWithData >= MIN_MONTHS_REQUIRED;

  const categoryIds = new Set<string | null>([
    ...currentByCategory.keys(),
    ...historicalByMonth.flatMap((m) => [...m.keys()]),
  ]);

  const categories = await prisma.category.findMany({
    where: { id: { in: [...categoryIds].filter((id): id is string => id !== null) } },
  });
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const alerts: AnthillAlert[] = [];

  if (hasEnoughHistory) {
    for (const categoryId of categoryIds) {
      const currentSpend = currentByCategory.get(categoryId) ?? 0;
      const historicalAverage =
        historicalByMonth.reduce((sum, m) => sum + (m.get(categoryId) ?? 0), 0) / monthsWithData;

      if (currentSpend < MIN_AMOUNT_TO_FLAG) continue;

      const deviationPct =
        historicalAverage > 0 ? (currentSpend - historicalAverage) / historicalAverage : Infinity;

      if (deviationPct > DEVIATION_THRESHOLD) {
        alerts.push({
          categoryId,
          categoryName: categoryId ? (categoryNameById.get(categoryId) ?? "Categoría eliminada") : "Sin categoría",
          currentSpend,
          historicalAverage,
          deviationPct,
        });
      }
    }
    alerts.sort((a, b) => b.deviationPct - a.deviationPct);
  }

  let overall: AnthillAlert | null = null;
  if (hasEnoughHistory) {
    const currentTotal = [...currentByCategory.values()].reduce((s, v) => s + v, 0);
    const historicalTotal =
      historicalByMonth.reduce(
        (sum, m) => sum + [...m.values()].reduce((s, v) => s + v, 0),
        0
      ) / monthsWithData;
    const deviationPct =
      historicalTotal > 0 ? (currentTotal - historicalTotal) / historicalTotal : currentTotal > 0 ? Infinity : 0;

    overall = {
      categoryId: null,
      categoryName: "Total acumulado",
      currentSpend: currentTotal,
      historicalAverage: historicalTotal,
      deviationPct,
    };
  }

  return {
    hasEnoughHistory,
    monthsOfHistory: monthsWithData,
    daysCompared: daysElapsed,
    overall,
    alerts,
  };
}

async function sumByCategory(start: Date, end: Date): Promise<Map<string | null, number>> {
  const results = await prisma.transaction.groupBy({
    by: ["categoryId"],
    _sum: { amount: true },
    where: { type: TxType.EXPENSE, date: { gte: start, lte: end } },
  });

  return new Map(results.map((r) => [r.categoryId, Number(r._sum.amount ?? 0)]));
}
