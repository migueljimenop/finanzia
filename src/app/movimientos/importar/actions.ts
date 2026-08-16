"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { parseLocalDate } from "@/lib/date";
import { generateStoredName, saveUpload } from "@/lib/storage";
import { TxType, TxSource, Bank } from "@/generated/prisma/client";

const importSchema = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().min(1).nullable(),
  rows: z
    .array(
      z.object({
        date: z.string().min(1),
        amount: z.number().positive(),
        description: z.string().trim().optional(),
        type: z.enum(TxType),
      })
    )
    .min(1, "No hay filas válidas para importar"),
});

export type ImportMovementsInput = z.infer<typeof importSchema>;

export async function importMovements(input: ImportMovementsInput) {
  const userId = await requireUserId();
  const data = importSchema.parse(input);

  await prisma.transaction.createMany({
    data: data.rows.map((row) => ({
      userId,
      accountId: data.accountId,
      categoryId: data.categoryId,
      type: row.type,
      date: parseLocalDate(row.date),
      amount: row.amount,
      description: row.description || null,
      source: TxSource.IMPORT,
    })),
  });

  revalidatePath("/movimientos");
  revalidatePath("/");
  redirect("/movimientos");
}

/**
 * Persiste la cartola original (archivo + metadatos) asociada al usuario y la
 * cuenta. Es best-effort: si falla, el import de movimientos de `importMovements`
 * ya se encargó de la carga de datos y aquí solo se reporta el error.
 */
export async function uploadDocument(formData: FormData) {
  const userId = await requireUserId();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No se recibió el archivo de la cartola.");
  }

  const accountId = formData.get("accountId");
  const storedName = generateStoredName(file.name);

  await saveUpload(file, storedName);

  await prisma.document.create({
    data: {
      userId,
      accountId: typeof accountId === "string" && accountId ? accountId : null,
      originalName: file.name,
      storedName,
      mime: file.type || null,
      size: file.size,
      bank: parseBank(formData.get("bank")),
      rowCount: parseInt(String(formData.get("rowCount") ?? "0"), 10) || 0,
    },
  });

  return { ok: true };
}

function parseBank(value: FormDataEntryValue | null): Bank | null {
  if (typeof value !== "string" || !Object.values(Bank).includes(value as Bank)) return null;
  return value as Bank;
}
