import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCLP, TX_TYPE_LABELS, TX_SOURCE_LABELS } from "@/lib/format";
import { DeleteMovementButton } from "./DeleteMovementButton";

export const dynamic = "force-dynamic";

export default async function MovimientosPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
    take: 100,
    include: { account: true, category: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Movimientos</h1>
        <div className="flex gap-3">
          <Link
            href="/movimientos/importar"
            className="border rounded px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
          >
            Importar CSV
          </Link>
          <Link
            href="/movimientos/nueva"
            className="bg-black text-white rounded px-4 py-2 text-sm hover:bg-neutral-800"
          >
            + Nuevo movimiento
          </Link>
        </div>
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Cuenta</th>
              <th className="px-4 py-2">Categoría</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Descripción</th>
              <th className="px-4 py-2">Origen</th>
              <th className="px-4 py-2 text-right">Monto</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t">
                <td className="px-4 py-2 whitespace-nowrap">
                  {tx.date.toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{tx.account.name}</td>
                <td className="px-4 py-2 whitespace-nowrap">{tx.category?.name ?? "—"}</td>
                <td className="px-4 py-2 whitespace-nowrap">{TX_TYPE_LABELS[tx.type]}</td>
                <td className="px-4 py-2">{tx.description ?? "—"}</td>
                <td className="px-4 py-2 whitespace-nowrap">{TX_SOURCE_LABELS[tx.source]}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">{formatCLP(tx.amount)}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                    <Link
                      href={`/movimientos/${tx.id}/editar`}
                      className="text-sm text-neutral-600 hover:underline"
                    >
                      Editar
                    </Link>
                    <DeleteMovementButton id={tx.id} />
                  </div>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-neutral-500">
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
