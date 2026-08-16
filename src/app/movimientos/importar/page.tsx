import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { BANK_LABELS } from "@/lib/format";
import { ImportWizard } from "./ImportWizard";

export const dynamic = "force-dynamic";

export default async function ImportarMovimientosPage() {
  const userId = await requireUserId();
  const [accounts, categories, documents] = await Promise.all([
    prisma.account.findMany({
      where: { userId },
      select: { id: true, name: true, bank: true, accountNumber: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { userId },
      select: { id: true, name: true, kind: true },
      orderBy: { name: "asc" },
    }),
    prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { account: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Link href="/movimientos" className="link-quiet">
          ← Volver a movimientos
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">Importar movimientos</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Sube una cartola en CSV, XLS o XLSX. Si el formato de Santander, Banco de
          Chile o Falabella se reconoce automáticamente, se detecta la cuenta y el
          tipo de cada movimiento; si no, puedes mapear las columnas manualmente.
        </p>
      </div>

      <ImportWizard accounts={accounts} categories={categories} />

      <section>
        <h2 className="text-base font-semibold tracking-tight mb-3">Cartolas importadas</h2>
        {documents.length === 0 ? (
          <p className="text-foreground-muted text-sm">Aún no has importado cartolas.</p>
        ) : (
          <div className="surface-card overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Cuenta</th>
                  <th>Banco</th>
                  <th>Filas</th>
                  <th>Tamaño</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="font-medium">{doc.originalName}</td>
                    <td className="text-foreground-secondary">{doc.account?.name ?? "—"}</td>
                    <td className="text-foreground-muted">
                      {doc.bank ? BANK_LABELS[doc.bank] : "—"}
                    </td>
                    <td className="num">{doc.rowCount}</td>
                    <td className="text-foreground-secondary">{formatBytes(doc.size)}</td>
                    <td className="text-foreground-muted text-sm">
                      {doc.createdAt.toLocaleDateString("es-CL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
