import Link from "next/link";
import { Landmark, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCLP, BANK_LABELS, ACCOUNT_TYPE_LABELS } from "@/lib/format";
import { DeleteAccountButton } from "./DeleteAccountButton";

export const dynamic = "force-dynamic";

export default async function CuentasPage() {
  const userId = await requireUserId();
  const accounts = await prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Cuentas</h1>
        <Link href="/cuentas/nueva" className="btn btn-primary">
          <Plus size={16} strokeWidth={2.5} aria-hidden />
          Nueva cuenta
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
                <td colSpan={6} className="py-14">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <span
                      className="icon-badge"
                      style={{ width: "3rem", height: "3rem", background: "var(--surface-sunken)", color: "var(--foreground-muted)" }}
                    >
                      <Landmark size={22} strokeWidth={2} aria-hidden />
                    </span>
                    <p className="text-sm text-foreground-muted">No hay cuentas registradas todavía.</p>
                    <Link href="/cuentas/nueva" className="btn btn-primary">
                      <Plus size={16} strokeWidth={2.5} aria-hidden />
                      Crear tu primera cuenta
                    </Link>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
