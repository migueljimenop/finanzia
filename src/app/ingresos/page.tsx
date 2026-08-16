import { prisma } from "@/lib/prisma";
import { formatCLP, BUCKET_TYPE_LABELS, accountLabel } from "@/lib/format";
import { registerIncome } from "./actions";

export const dynamic = "force-dynamic";

export default async function IngresosPage() {
  const [accounts, rules, incomes] = await Promise.all([
    prisma.account.findMany({ orderBy: { name: "asc" } }),
    prisma.distributionRule.findMany({
      where: { isActive: true },
      include: { buckets: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.income.findMany({
      orderBy: { date: "desc" },
      take: 10,
      include: { account: true, distributions: true },
    }),
  ]);

  const santander = accounts.find((a) => a.bank === "SANTANDER");

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">Registrar ingreso</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Al registrar el sueldo se aplica la regla de distribución activa y se calculan
          los sobres automáticamente.
        </p>
      </div>

      <form action={registerIncome} className="flex flex-col gap-4 max-w-sm">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Cuenta de destino</span>
          <select
            name="accountId"
            required
            defaultValue={santander?.id}
            className="border rounded px-3 py-2"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {accountLabel(account)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Regla de distribución</span>
          <select name="ruleId" required className="border rounded px-3 py-2">
            {rules.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.name}
              </option>
            ))}
          </select>
          {rules.length === 0 && (
            <span className="text-sm text-red-600">
              No hay reglas de distribución activas.
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Fecha</span>
          <input
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="border rounded px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Monto (CLP)</span>
          <input name="amount" type="number" step="1" required className="border rounded px-3 py-2" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Descripción (opcional)</span>
          <input name="description" type="text" className="border rounded px-3 py-2" />
        </label>

        <button
          type="submit"
          disabled={rules.length === 0}
          className="bg-black text-white rounded px-4 py-2 hover:bg-neutral-800 disabled:opacity-50"
        >
          Registrar ingreso
        </button>
      </form>

      <div>
        <h2 className="text-lg font-semibold mb-3">Últimos ingresos</h2>
        <div className="flex flex-col gap-4">
          {incomes.map((income) => (
            <div key={income.id} className="border rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {formatCLP(income.amount)} → {income.account.name}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {income.date.toLocaleDateString("es-CL")}
                    {income.description ? ` · ${income.description}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {income.distributions.map((d) => (
                  <div key={d.id} className="bg-neutral-100 dark:bg-neutral-900 rounded p-2">
                    <p className="text-neutral-500">{BUCKET_TYPE_LABELS[d.type]}</p>
                    <p className="font-medium">{formatCLP(d.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {incomes.length === 0 && (
            <p className="text-neutral-500">Aún no registras ingresos.</p>
          )}
        </div>
      </div>
    </div>
  );
}
