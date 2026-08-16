import Link from "next/link";
import {
  Landmark,
  Wallet,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  CircleCheck,
  Circle,
  TriangleAlert,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCLP, BANK_LABELS, BUCKET_TYPE_LABELS } from "@/lib/format";
import { getMarginSummary, getBucketBreakdown, getConsolidatedBalance } from "@/lib/margin";
import { getMonthEndForecast } from "@/lib/forecast";
import { getAnthillReport } from "@/lib/alerts";
import { BucketType } from "@/generated/prisma/enums";
import { BUCKET_COLORS } from "@/lib/bucket-colors";

export const dynamic = "force-dynamic";

const BUCKET_ICONS: Record<BucketType, LucideIcon> = {
  INVESTMENT: TrendingUp,
  HOME_TRANSFER: Landmark,
  CREDIT_INSTALLMENT: Wallet,
  AVAILABLE_MARGIN: Sparkles,
};

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
        <div className="surface-card-accent p-5 sm:col-span-3 flex items-center gap-4">
          <span className="icon-badge" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
            <Landmark size={20} strokeWidth={2.25} aria-hidden />
          </span>
          <div>
            <p className="stat-label">Saldo consolidado</p>
            <p className="stat-value text-3xl font-semibold mt-1">{formatCLP(consolidatedBalance)}</p>
          </div>
        </div>
        <div className="surface-card p-5">
          <div className="flex items-center gap-3">
            <span className="icon-badge" style={{ background: "var(--status-good-bg)", color: "var(--status-good)" }}>
              <Wallet size={18} strokeWidth={2.25} aria-hidden />
            </span>
            <p className="stat-label">Margen disponible este mes</p>
          </div>
          <p className="stat-value text-2xl font-semibold mt-3">{formatCLP(margin.remaining)}</p>
          <p className="text-xs text-foreground-muted mt-1.5">
            de {formatCLP(margin.monthlyMargin)} · gastado {formatCLP(margin.spent)}
          </p>
        </div>
        <div className="surface-card p-5">
          <div className="flex items-center gap-3">
            <span className="icon-badge" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              <CalendarClock size={18} strokeWidth={2.25} aria-hidden />
            </span>
            <p className="stat-label">Puedes gastar hoy</p>
          </div>
          <p className="stat-value text-2xl font-semibold mt-3">{formatCLP(margin.dailyAvailable)}</p>
          <p className="text-xs text-foreground-muted mt-1.5">
            quedan {margin.daysRemaining} días en el mes
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-3">Forecast de cierre de mes</h2>
        <div className="surface-card p-5">
          <span className={forecast.onTrack ? "badge-good" : "badge-critical"}>
            {forecast.onTrack ? (
              <TrendingUp size={14} strokeWidth={2.5} aria-hidden />
            ) : (
              <TrendingDown size={14} strokeWidth={2.5} aria-hidden />
            )}
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
            <CircleCheck size={14} strokeWidth={2.5} aria-hidden />
            Tu gasto de este mes está dentro de lo normal comparado con los últimos{" "}
            {anthill.monthsOfHistory} meses
          </span>
        ) : (
          <div className="flex flex-col gap-2">
            {anthill.alerts.map((alert) => (
              <div key={alert.categoryId ?? "sin-categoria"} className="surface-card p-4">
                <span className="badge-serious mb-1.5">
                  <TriangleAlert size={14} strokeWidth={2.5} aria-hidden />
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
              <div className="flex items-center gap-3">
                <span
                  className="icon-badge"
                  style={{ background: "var(--surface-sunken)", color: "var(--foreground-secondary)" }}
                >
                  <Landmark size={16} strokeWidth={2.25} aria-hidden />
                </span>
                <div>
                  <p className="font-medium text-sm">{account.name}</p>
                  <p className="text-xs text-foreground-muted mt-0.5">{BANK_LABELS[account.bank]}</p>
                </div>
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
            {breakdown.map((b) => {
              const color = BUCKET_COLORS[b.type];
              const Icon = BUCKET_ICONS[b.type];
              return (
                <div key={b.type} className="surface-card p-4" style={{ borderTopColor: color, borderTopWidth: "3px" }}>
                  <span
                    className="icon-badge"
                    style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
                  >
                    <Icon size={16} strokeWidth={2.25} aria-hidden />
                  </span>
                  <p className="stat-label mt-2.5">{BUCKET_TYPE_LABELS[b.type]}</p>
                  <p className="stat-value font-semibold mt-1">{formatCLP(b.amount)}</p>
                </div>
              );
            })}
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
        <span className={done ? "badge-good mt-0.5" : "badge-warning mt-0.5"} aria-hidden>
          {done ? (
            <CircleCheck size={14} strokeWidth={2.5} />
          ) : (
            <Circle size={14} strokeWidth={2.5} />
          )}
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
