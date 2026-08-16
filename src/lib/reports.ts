import { getMonthRange } from "@/lib/margin";
import {
  sumExpenseByAccount,
  sumExpenseByCategoryWithNames,
  sumExpenseTotal,
} from "@/lib/queries";
import { REPORT_COMPARISON_MONTHS } from "@/lib/config";

export async function getSpendByAccount(reference: Date = new Date()) {
  const { start, end } = getMonthRange(reference);
  return sumExpenseByAccount(start, end);
}

export async function getSpendByCategory(reference: Date = new Date()) {
  const { start, end } = getMonthRange(reference);
  return sumExpenseByCategoryWithNames(start, end);
}

export async function getMonthlyComparison(
  reference: Date = new Date(),
  monthsBack = REPORT_COMPARISON_MONTHS
) {
  const months: { label: string; amount: number }[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthDate = new Date(reference.getFullYear(), reference.getMonth() - i, 1);
    const { start, end } = getMonthRange(monthDate);

    months.push({
      label: monthDate.toLocaleDateString("es-CL", { month: "short", year: "2-digit" }),
      amount: await sumExpenseTotal(start, end),
    });
  }

  return months;
}