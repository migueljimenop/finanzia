import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatCLP, BANK_LABELS, ACCOUNT_TYPE_LABELS } from "@/lib/format";
import { DeleteAccountButton } from "./DeleteAccountButton";

export const dynamic = "force-dynamic";

export default async function CuentasPage() {
  const accounts = await prisma.account.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cuentas</h1>
        <Link
          href="/cuentas/nueva"
          className="bg-black text-white rounded px-4 py-2 text-sm hover:bg-neutral-800"
        >
          + Nueva cuenta
        </Link>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-100 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-2">Nombre</th>
              <th className="px-4 py-2">Banco</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2 text-right">Saldo</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-t">
                <td className="px-4 py-2">{account.name}</td>
                <td className="px-4 py-2">{BANK_LABELS[account.bank]}</td>
                <td className="px-4 py-2">{ACCOUNT_TYPE_LABELS[account.type]}</td>
                <td className="px-4 py-2 text-right">{formatCLP(account.balance)}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/cuentas/${account.id}/editar`}
                      className="text-sm text-neutral-600 hover:underline"
                    >
                      Editar
                    </Link>
                    <DeleteAccountButton id={account.id} name={account.name} />
                  </div>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-neutral-500">
                  No hay cuentas registradas todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
