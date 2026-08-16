"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { parseLocalDate } from "@/lib/date";
import { TxType, TxSource } from "@/generated/prisma/client";

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
