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
        <h1 className="text-2xl font-semibold tracking-tight">Cuentas</h1>
        <Link href="/cuentas/nueva" className="btn btn-primary">
          + Nueva cuenta
        </Link>
      </div>

      <div className="surface-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Banco</th>
              <th>N° de cuenta</th>
              <th>Tipo</th>
              <th className="text-right">Saldo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td className="font-medium">{account.name}</td>
                <td className="text-foreground-secondary">{BANK_LABELS[account.bank]}</td>
                <td className="text-foreground-muted">{account.accountNumber ?? "—"}</td>
                <td className="text-foreground-secondary">{ACCOUNT_TYPE_LABELS[account.type]}</td>
                <td className="text-right num">{formatCLP(account.balance)}</td>
                <td>
                  <div className="flex items-center justify-end gap-4">
                    <Link href={`/cuentas/${account.id}/editar`} className="link-quiet">
                      Editar
                    </Link>
                    <DeleteAccountButton id={account.id} name={account.name} />
                  </div>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-foreground-muted py-8">
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
