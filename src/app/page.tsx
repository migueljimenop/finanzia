import { prisma } from "@/lib/prisma";
import { formatCLP, BANK_LABELS, BUCKET_TYPE_LABELS } from "@/lib/format";
import { getMarginSummary, getBucketBreakdown, getConsolidatedBalance } from "@/lib/margin";
import { getMonthEndForecast } from "@/lib/forecast";
import { getAnthillReport } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [accounts, consolidatedBalance, margin, breakdown, forecast, anthill] = await Promise.all([
    prisma.account.findMany({ orderBy: { name: "asc" } }),
    getConsolidatedBalance(),
    getMarginSummary(),
    getBucketBreakdown(),
    getMonthEndForecast(),
    getAnthillReport(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Resumen del mes actual: {new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <p className="text-sm text-neutral-500">Saldo consolidado</p>
          <p className="text-2xl font-semibold mt-1">{formatCLP(consolidatedBalance)}</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-sm text-neutral-500">Margen disponible este mes</p>
          <p className="text-2xl font-semibold mt-1">{formatCLP(margin.remaining)}</p>
          <p className="text-xs text-neutral-500 mt-1">
            de {formatCLP(margin.monthlyMargin)} · gastado {formatCLP(margin.spent)}
          </p>
        </div>
        <div className="border rounded p-4">
          <p className="text-sm text-neutral-500">Puedes gastar hoy</p>
          <p className="text-2xl font-semibold mt-1">{formatCLP(margin.dailyAvailable)}</p>
          <p className="text-xs text-neutral-500 mt-1">
            quedan {margin.daysRemaining} días en el mes
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Forecast de cierre de mes</h2>
        <div className="border rounded p-4">
          <p className={forecast.onTrack ? "text-green-700 dark:text-green-500" : "text-red-600"}>
            {forecast.onTrack
              ? `Si sigues a este ritmo, terminas el mes con ${formatCLP(forecast.projectedRemaining)} de margen disponible.`
              : `Si sigues a este ritmo, te vas a pasar del margen por ${formatCLP(Math.abs(forecast.projectedRemaining))}.`}
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            Gasto proyectado a fin de mes: {formatCLP(forecast.projectedSpend)} (día {forecast.daysElapsed} de{" "}
            {forecast.daysInMonth}, ritmo actual {formatCLP(forecast.dailyRate)}/día) · margen mensual{" "}
            {formatCLP(forecast.monthlyMargin)}
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Alertas de gasto hormiga</h2>
        {!anthill.hasEnoughHistory ? (
          <p className="text-neutral-500 text-sm">
            Necesitas al menos 2 meses de historial de gastos para calcular el promedio y
            detectar desviaciones.
          </p>
        ) : anthill.alerts.length === 0 ? (
          <p className="text-green-700 dark:text-green-500 text-sm">
            Tu gasto de este mes está dentro de lo normal comparado con los últimos{" "}
            {anthill.monthsOfHistory} meses.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {anthill.alerts.map((alert) => (
              <div key={alert.categoryId ?? "sin-categoria"} className="border border-amber-300 dark:border-amber-800 rounded p-3">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-500">
                  {alert.categoryName}: {formatCLP(alert.currentSpend)} este mes, un{" "}
                  {Math.round(alert.deviationPct * 100)}% sobre tu promedio de{" "}
                  {formatCLP(alert.historicalAverage)} en los últimos {anthill.daysCompared} días de
                  cada mes.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Cuentas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map((account) => (
            <div key={account.id} className="border rounded p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{account.name}</p>
                <p className="text-sm text-neutral-500">{BANK_LABELS[account.bank]}</p>
              </div>
              <p className="font-semibold">{formatCLP(account.balance)}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Desglose por sobre (este mes)</h2>
        {breakdown.length === 0 ? (
          <p className="text-neutral-500">
            Aún no registras ingresos este mes, así que no hay sobres calculados.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {breakdown.map((b) => (
              <div key={b.type} className="border rounded p-4">
                <p className="text-sm text-neutral-500">{BUCKET_TYPE_LABELS[b.type]}</p>
                <p className="font-semibold mt-1">{formatCLP(b.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
