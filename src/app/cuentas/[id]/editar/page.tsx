import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AccountForm } from "../../AccountForm";
import { updateAccount } from "../../actions";

export default async function EditarCuentaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await prisma.account.findUnique({ where: { id } });

  if (!account) notFound();

  const boundUpdateAccount = updateAccount.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/cuentas" className="text-sm text-neutral-500 hover:underline">
          ← Volver a cuentas
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Editar cuenta</h1>
      </div>

      <AccountForm
        action={boundUpdateAccount}
        submitLabel="Guardar cambios"
        defaultValues={{
          name: account.name,
          bank: account.bank,
          type: account.type,
          balance: Number(account.balance),
          accountNumber: account.accountNumber,
        }}
      />
    </div>
  );
}
