import { prisma } from "@/lib/prisma";
import { getMonthRange } from "@/lib/margin";
import { sumExpenseByCategory } from "@/lib/queries";
import {
  ALERT_MIN_MONTHS_REQUIRED,
  ALERT_DEVIATION_THRESHOLD,
  ALERT_MIN_AMOUNT_TO_FLAG,
  ALERT_MONTHS_OF_HISTORY,
} from "@/lib/config";

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

const MIN_MONTHS_REQUIRED = ALERT_MIN_MONTHS_REQUIRED;
const DEVIATION_THRESHOLD = ALERT_DEVIATION_THRESHOLD;
const MIN_AMOUNT_TO_FLAG = ALERT_MIN_AMOUNT_TO_FLAG;

/**
 * Compara el gasto acumulado del mes (hasta hoy) contra el promedio de esos
 * mismos días en los `monthsOfHistory` meses anteriores, por categoría y en
 * total. Marca como alerta cuando el gasto actual supera el promedio
 * histórico en más de `DEVIATION_THRESHOLD`. Solo considera el gasto de las
 * cuentas del margen (src/lib/config.ts).
 */
export async function getAnthillReport(
  userId: string,
  reference: Date = new Date(),
  monthsOfHistory = ALERT_MONTHS_OF_HISTORY
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

  const currentByCategory = await sumExpenseByCategory(start, currentEnd, userId);

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

    const monthTotals = await sumExpenseByCategory(monthStart, monthEnd, userId);
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
    where: { userId, id: { in: [...categoryIds].filter((id): id is string => id !== null) } },
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
