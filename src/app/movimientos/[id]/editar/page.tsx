import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { toDateInputValue } from "@/lib/date";
import { MovementForm } from "../../MovementForm";
import { updateMovement } from "../../actions";

export default async function EditarMovimientoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [transaction, accounts, categories] = await Promise.all([
    prisma.transaction.findUnique({ where: { id } }),
    prisma.account.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({
      select: { id: true, name: true, kind: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!transaction) notFound();

  const boundUpdateMovement = updateMovement.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/movimientos" className="text-sm text-neutral-500 hover:underline">
          ← Volver a movimientos
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Editar movimiento</h1>
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
