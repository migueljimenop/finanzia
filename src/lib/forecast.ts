import { getMarginSummary, getMonthRange } from "@/lib/margin";

/**
 * Proyecta el gasto de fin de mes extrapolando el ritmo de gasto actual
 * (gasto acumulado / días transcurridos) a los días totales del mes.
 */
export async function getMonthEndForecast(reference: Date = new Date()) {
  const margin = await getMarginSummary(reference);
  const { start, end } = getMonthRange(reference);

  const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const daysInMonth = end.getDate();
  const daysElapsed = Math.min(
    Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    daysInMonth
  );

  const dailyRate = daysElapsed > 0 ? margin.spent / daysElapsed : 0;
  const projectedSpend = dailyRate * daysInMonth;
  const projectedRemaining = margin.monthlyMargin - projectedSpend;

  return {
    daysElapsed,
    daysInMonth,
    dailyRate,
    projectedSpend,
    projectedRemaining,
    onTrack: projectedRemaining >= 0,
    monthlyMargin: margin.monthlyMargin,
    spentSoFar: margin.spent,
  };
}
