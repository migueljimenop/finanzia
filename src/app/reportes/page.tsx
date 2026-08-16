import Link from "next/link";
import { getSpendByAccount, getSpendByCategory, getMonthlyComparison } from "@/lib/reports";
import { parseMonthParam, toMonthParam } from "@/lib/date";
import { BANK_LABELS, formatCLP } from "@/lib/format";
import { BarList } from "./BarList";

export const dynamic = "force-dynamic";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const reference = parseMonthParam(month);

  const prevMonth = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  const nextMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);

  const [byAccount, byCategory, monthly] = await Promise.all([
    getSpendByAccount(reference),
    getSpendByCategory(reference),
    getMonthlyComparison(reference, 6),
  ]);

  const totalSpend = byAccount.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reportes</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Gasto total del mes: {formatCLP(totalSpend)}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/reportes?month=${toMonthParam(prevMonth)}`} className="hover:underline">
            ← Anterior
          </Link>
          <span className="font-medium">{monthLabel(reference)}</span>
          <Link href={`/reportes?month=${toMonthParam(nextMonth)}`} className="hover:underline">
            Siguiente →
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Gasto por cuenta / tarjeta</h2>
        <BarList
          items={byAccount.map((a) => ({
            label: `${a.accountName}${a.bank ? ` (${BANK_LABELS[a.bank]})` : ""}`,
            amount: a.amount,
            highlight: a.bank === "FALABELLA",
          }))}
          emptyLabel="Sin gastos registrados este mes."
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Gasto por categoría</h2>
        <BarList
          items={byCategory.map((c) => ({ label: c.categoryName, amount: c.amount }))}
          emptyLabel="Sin gastos registrados este mes."
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Comparativo mensual (últimos 6 meses)</h2>
        <BarList
          items={monthly.map((m) => ({ label: m.label, amount: m.amount }))}
          emptyLabel="Sin datos históricos todavía."
        />
      </div>
    </div>
  );
}

function monthLabel(date: Date): string {
  const text = date.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}
