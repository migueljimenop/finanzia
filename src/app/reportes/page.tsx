import Link from "next/link";
import { ChevronLeft, ChevronRight, Landmark, Tag, BarChart3 } from "lucide-react";
import { getSpendByAccount, getSpendByCategory, getMonthlyComparison } from "@/lib/reports";
import { parseMonthParam, toMonthParam } from "@/lib/date";
import { requireUserId } from "@/lib/session";
import { BANK_LABELS, formatCLP } from "@/lib/format";
import { Bank } from "@/generated/prisma/enums";
import { BarList } from "./BarList";

export const dynamic = "force-dynamic";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const userId = await requireUserId();
  const { month } = await searchParams;
  const reference = parseMonthParam(month);

  const prevMonth = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  const nextMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 1);

  const [byAccount, byCategory, monthly] = await Promise.all([
    getSpendByAccount(userId, reference),
    getSpendByCategory(userId, reference),
    getMonthlyComparison(userId, reference, 6),
  ]);

  const totalSpend = byAccount.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Gasto total del mes: <span className="stat-value font-medium text-foreground">{formatCLP(totalSpend)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            href={`/reportes?month=${toMonthParam(prevMonth)}`}
            className="btn btn-secondary !px-2.5"
            aria-label="Mes anterior"
          >
            <ChevronLeft size={16} strokeWidth={2.25} aria-hidden />
          </Link>
          <span className="font-medium min-w-32 text-center">{monthLabel(reference)}</span>
          <Link
            href={`/reportes?month=${toMonthParam(nextMonth)}`}
            className="btn btn-secondary !px-2.5"
            aria-label="Mes siguiente"
          >
            <ChevronRight size={16} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
      </div>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-3 flex items-center gap-2">
          <Landmark size={16} strokeWidth={2.25} className="text-foreground-muted" aria-hidden />
          Gasto por cuenta / tarjeta
        </h2>
        <div className="surface-card p-5">
          <BarList
            items={byAccount.map((a) => ({
              label:
                a.accountName + (a.bank && BANK_LABELS[a.bank] !== a.accountName ? ` (${BANK_LABELS[a.bank]})` : ""),
              amount: a.amount,
              highlight: a.bank === Bank.FALABELLA,
            }))}
            emptyLabel="Sin gastos registrados este mes."
          />
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-3 flex items-center gap-2">
          <Tag size={16} strokeWidth={2.25} className="text-foreground-muted" aria-hidden />
          Gasto por categoría
        </h2>
        <div className="surface-card p-5">
          <BarList
            items={byCategory.map((c) => ({ label: c.categoryName, amount: c.amount }))}
            emptyLabel="Sin gastos registrados este mes."
          />
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-3 flex items-center gap-2">
          <BarChart3 size={16} strokeWidth={2.25} className="text-foreground-muted" aria-hidden />
          Comparativo mensual (últimos 6 meses)
        </h2>
        <div className="surface-card p-5">
          <BarList
            items={monthly.map((m) => ({ label: m.label, amount: m.amount }))}
            emptyLabel="Sin datos históricos todavía."
          />
        </div>
      </section>
    </div>
  );
}

function monthLabel(date: Date): string {
  const text = date.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}
