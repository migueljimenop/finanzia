import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCLP, BANK_LABELS, BUCKET_TYPE_LABELS } from "@/lib/format";
import { getMarginSummary, getBucketBreakdown, getConsolidatedBalance } from "@/lib/margin";
import { getMonthEndForecast } from "@/lib/forecast";
import { getAnthillReport } from "@/lib/alerts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await requireUserId();

  const [accounts, consolidatedBalance, margin, breakdown, forecast, anthill, ruleCount] = await Promise.all([
    prisma.account.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    getConsolidatedBalance(userId),
    getMarginSummary(userId),
    getBucketBreakdown(userId),
    getMonthEndForecast(userId),
    getAnthillReport(userId),
    prisma.distributionRule.count({ where: { userId, isActive: true } }),
  ]);

  const hasAccounts = accounts.length > 0;
  const hasRule = ruleCount > 0;
  const needsSetup = !hasAccounts || !hasRule;

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Resumen del mes actual:{" "}
          {new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
        </p>
      </div>

      {needsSetup && (
        <section className="surface-card p-5 flex flex-col gap-3">
          <h2 className="text-base font-semibold tracking-tight">Primeros pasos</h2>
          <SetupStep
            done={hasAccounts}
            label="Crea tus cuentas"
            description="Cada banco o tarjeta que quieras seguir (Santander, Falabella, Mercado Pago, etc.)."
            href="/cuentas/nueva"
            cta="Crear cuenta"
          />
          <SetupStep
            done={hasRule}
            label="Configura tu regla de distribución"
            description="Cómo se reparte tu sueldo en sobres. La necesitas antes de poder registrar un ingreso."
            href="/regla"
            cta="Configurar regla"
          />
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface-card p-5">
          <p className="stat-label">Saldo consolidado</p>
          <p className="stat-value text-2xl font-semibold mt-2">{formatCLP(consolidatedBalance)}</p>
        </div>
        <div className="surface-card p-5">
          <p className="stat-label">Margen disponible este mes</p>
          <p className="stat-value text-2xl font-semibold mt-2">{formatCLP(margin.remaining)}</p>
          <p className="text-xs text-foreground-muted mt-1.5">
            de {formatCLP(margin.monthlyMargin)} · gastado {formatCLP(margin.spent)}
          </p>
        </div>
        <div className="surface-card p-5">
          <p className="stat-label">Puedes gastar hoy</p>
          <p className="stat-value text-2xl font-semibold mt-2">{formatCLP(margin.dailyAvailable)}</p>
          <p className="text-xs text-foreground-muted mt-1.5">
            quedan {margin.daysRemaining} días en el mes
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-3">Forecast de cierre de mes</h2>
        <div className="surface-card p-5">
          <span className={forecast.onTrack ? "badge-good" : "badge-critical"}>
            <span className="status-dot bg-current" />
            {forecast.onTrack
              ? `Terminas el mes con ${formatCLP(forecast.projectedRemaining)} de margen`
              : `Te pasas del margen por ${formatCLP(Math.abs(forecast.projectedRemaining))}`}
          </span>
          <p className="text-xs text-foreground-muted mt-3">
            Gasto proyectado a fin de mes: {formatCLP(forecast.projectedSpend)} (día {forecast.daysElapsed}{" "}
            de {forecast.daysInMonth}, ritmo actual {formatCLP(forecast.dailyRate)}/día) · margen mensual{" "}
            {formatCLP(forecast.monthlyMargin)}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-3">Alertas de gasto hormiga</h2>
        {!anthill.hasEnoughHistory ? (
          <p className="text-foreground-muted text-sm">
            Necesitas al menos 2 meses de historial de gastos para calcular el promedio y
            detectar desviaciones.
          </p>
        ) : anthill.alerts.length === 0 ? (
          <span className="badge-good">
            <span className="status-dot bg-current" />
            Tu gasto de este mes está dentro de lo normal comparado con los últimos{" "}
            {anthill.monthsOfHistory} meses
          </span>
        ) : (
          <div className="flex flex-col gap-2">
            {anthill.alerts.map((alert) => (
              <div key={alert.categoryId ?? "sin-categoria"} className="surface-card p-4">
                <span className="badge-warning mb-1.5">
                  <span className="status-dot bg-current" />
                  {alert.categoryName}
                </span>
                <p className="text-sm text-foreground-secondary">
                  {formatCLP(alert.currentSpend)} este mes, un {Math.round(alert.deviationPct * 100)}%
                  sobre tu promedio de {formatCLP(alert.historicalAverage)} en los últimos{" "}
                  {anthill.daysCompared} días de cada mes.
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-3">Cuentas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.map((account) => (
            <div key={account.id} className="surface-card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{account.name}</p>
                <p className="text-xs text-foreground-muted mt-0.5">{BANK_LABELS[account.bank]}</p>
              </div>
              <p className="stat-value font-semibold text-sm">{formatCLP(account.balance)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-3">Desglose por sobre (este mes)</h2>
        {breakdown.length === 0 ? (
          <p className="text-foreground-muted text-sm">
            Aún no registras ingresos este mes, así que no hay sobres calculados.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {breakdown.map((b) => (
              <div key={b.type} className="surface-card p-4">
                <p className="stat-label">{BUCKET_TYPE_LABELS[b.type]}</p>
                <p className="stat-value font-semibold mt-1.5">{formatCLP(b.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SetupStep({
  done,
  label,
  description,
  href,
  cta,
}: {
  done: boolean;
  label: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <span
          className={done ? "badge-good mt-0.5" : "badge-warning mt-0.5"}
          aria-hidden
        >
          <span className="status-dot bg-current" />
          {done ? "Listo" : "Pendiente"}
        </span>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-foreground-muted mt-0.5">{description}</p>
        </div>
      </div>
      {!done && (
        <Link href={href} className="btn btn-secondary shrink-0">
          {cta}
        </Link>
      )}
    </div>
  );
}
