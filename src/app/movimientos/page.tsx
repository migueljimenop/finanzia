import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCLP, TX_TYPE_LABELS, TX_SOURCE_LABELS } from "@/lib/format";
import { DeleteMovementButton } from "./DeleteMovementButton";

export const dynamic = "force-dynamic";

const AMOUNT_PREFIX: Record<string, string> = { EXPENSE: "−", INCOME: "+", TRANSFER: "" };
const AMOUNT_CLASS: Record<string, string> = {
  EXPENSE: "text-foreground",
  INCOME: "text-[var(--status-good)]",
  TRANSFER: "text-foreground-muted",
};

export default async function MovimientosPage() {
  const userId = await requireUserId();
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 100,
    include: { account: true, category: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Movimientos</h1>
        <div className="flex gap-3">
          <Link href="/movimientos/importar" className="btn btn-secondary">
            Importar CSV
          </Link>
          <Link href="/movimientos/nueva" className="btn btn-primary">
            + Nuevo movimiento
          </Link>
        </div>
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cuenta</th>
              <th>Categoría</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Origen</th>
              <th className="text-right">Monto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td className="whitespace-nowrap text-foreground-secondary">
                  {tx.date.toLocaleDateString("es-CL")}
                </td>
                <td className="whitespace-nowrap">{tx.account.name}</td>
                <td className="whitespace-nowrap text-foreground-secondary">
                  {tx.category?.name ?? "—"}
                </td>
                <td className="whitespace-nowrap text-foreground-secondary">
                  {TX_TYPE_LABELS[tx.type]}
                </td>
                <td
                  className="max-w-xs truncate"
                  title={tx.description ?? undefined}
                >
                  {tx.description ?? "—"}
                </td>
                <td className="whitespace-nowrap text-foreground-muted">{TX_SOURCE_LABELS[tx.source]}</td>
                <td className={`text-right num whitespace-nowrap font-medium ${AMOUNT_CLASS[tx.type]}`}>
                  {AMOUNT_PREFIX[tx.type]}
                  {formatCLP(tx.amount)}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-4 whitespace-nowrap">
                    <Link href={`/movimientos/${tx.id}/editar`} className="link-quiet">
                      Editar
                    </Link>
                    <DeleteMovementButton id={tx.id} />
                  </div>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-foreground-muted py-8">
                  No hay movimientos registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
