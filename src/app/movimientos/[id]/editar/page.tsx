import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { toDateInputValue } from "@/lib/date";
import { BackLink } from "../../../BackLink";
import { MovementForm } from "../../MovementForm";
import { updateMovement } from "../../actions";

export default async function EditarMovimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireUserId();
  const [transaction, accounts, categories] = await Promise.all([
    prisma.transaction.findFirst({ where: { id, userId } }),
    prisma.account.findMany({
      where: { userId },
      select: { id: true, name: true, accountNumber: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { userId },
      select: { id: true, name: true, kind: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!transaction) notFound();

  const boundUpdateMovement = updateMovement.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackLink href="/movimientos" label="Volver a movimientos" />
        <h1 className="text-2xl font-semibold tracking-tight mt-2">Editar movimiento</h1>
      </div>

      <MovementForm
        action={boundUpdateMovement}
        accounts={accounts}
        categories={categories}
        submitLabel="Guardar cambios"
        defaultValues={{
          accountId: transaction.accountId,
          categoryId: transaction.categoryId,
          type: transaction.type,
          date: toDateInputValue(transaction.date),
          amount: Number(transaction.amount),
          description: transaction.description ?? "",
        }}
      />
    </div>
  );
}
