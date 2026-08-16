import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { BackLink } from "../../../BackLink";
import { AccountForm } from "../../AccountForm";
import { updateAccount } from "../../actions";

export default async function EditarCuentaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const account = await prisma.account.findFirst({ where: { id, userId } });

  if (!account) notFound();

  const boundUpdateAccount = updateAccount.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackLink href="/cuentas" label="Volver a cuentas" />
        <h1 className="text-2xl font-semibold tracking-tight mt-2">Editar cuenta</h1>
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
