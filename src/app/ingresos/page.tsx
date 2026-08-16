import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCLP, BUCKET_TYPE_LABELS, accountLabel } from "@/lib/format";
import { registerIncome } from "./actions";

export const dynamic = "force-dynamic";

export default async function IngresosPage() {
  const userId = await requireUserId();
  const [accounts, rules, incomes] = await Promise.all([
    prisma.account.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.distributionRule.findMany({
      where: { userId, isActive: true },
      include: { buckets: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.income.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 10,
      include: { account: true, distributions: true },
    }),
  ]);

  const santander = accounts.find((a) => a.bank === "SANTANDER");

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Registrar ingreso</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Al registrar el sueldo se aplica la regla de distribución activa y se calculan
          los sobres automáticamente.
        </p>
      </div>

      <form action={registerIncome} className="flex flex-col gap-5 max-w-sm">
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Cuenta de destino</span>
          <select name="accountId" required defaultValue={santander?.id} className="field-control">
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {accountLabel(account)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="field-label">Regla de distribución</span>
          <select name="ruleId" required className="field-control">
            {rules.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.name}
              </option>
            ))}
          </select>
          {rules.length === 0 && (
            <span className="text-sm text-[var(--status-critical)]">
              No hay reglas de distribución activas.
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="field-label">Fecha</span>
          <input
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="field-control"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="field-label">Monto (CLP)</span>
          <input name="amount" type="number" step="1" required className="field-control" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="field-label">Descripción (opcional)</span>
          <input name="description" type="text" className="field-control" />
        </label>

        <button type="submit" disabled={rules.length === 0} className="btn btn-primary w-fit">
          Registrar ingreso
        </button>
      </form>

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-3">Últimos ingresos</h2>
        <div className="flex flex-col gap-4">
          {incomes.map((income) => (
            <div key={income.id} className="surface-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    <span className="stat-value">{formatCLP(income.amount)}</span> → {income.account.name}
                  </p>
                  <p className="text-sm text-foreground-muted mt-0.5">
                    {income.date.toLocaleDateString("es-CL")}
                    {income.description ? ` · ${income.description}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {income.distributions.map((d) => (
                  <div key={d.id} className="rounded-lg p-2.5" style={{ background: "var(--background)" }}>
                    <p className="stat-label">{BUCKET_TYPE_LABELS[d.type]}</p>
                    <p className="stat-value font-medium mt-1">{formatCLP(d.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {incomes.length === 0 && (
            <p className="text-foreground-muted text-sm">Aún no registras ingresos.</p>
          )}
        </div>
      </section>
    </div>
  );
}
