import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { MovementForm } from "../MovementForm";
import { createMovement } from "../actions";

export const dynamic = "force-dynamic";

export default async function NuevoMovimientoPage() {
  const userId = await requireUserId();
  const [accounts, categories] = await Promise.all([
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/movimientos" className="link-quiet">
          ← Volver a movimientos
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">Nuevo movimiento</h1>
      </div>

      <MovementForm
        action={createMovement}
        accounts={accounts}
        categories={categories}
        submitLabel="Registrar movimiento"
      />
    </div>
  );
}
