import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ImportWizard } from "./ImportWizard";

export const dynamic = "force-dynamic";

export default async function ImportarMovimientosPage() {
  const [accounts, categories] = await Promise.all([
    prisma.account.findMany({
      select: { id: true, name: true, bank: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, kind: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/movimientos" className="text-sm text-neutral-500 hover:underline">
          ← Volver a movimientos
        </Link>
        <h1 className="text-2xl font-semibold mt-2">Importar movimientos</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Sube una cartola en CSV, XLS o XLSX. Si el formato de Santander, Banco de
          Chile o Falabella se reconoce automáticamente, se detecta la cuenta y el
          tipo de cada movimiento; si no, puedes mapear las columnas manualmente.
        </p>
      </div>

      <ImportWizard accounts={accounts} categories={categories} />
    </div>
  );
}
