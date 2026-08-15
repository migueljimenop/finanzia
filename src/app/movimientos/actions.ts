"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parseLocalDate } from "@/lib/date";
import { TxType, TxSource } from "@/generated/prisma/client";

const movementSchema = z.object({
  accountId: z.string().min(1),
  categoryId: z.string().min(1).optional().or(z.literal("")),
  type: z.enum(TxType),
  date: z.string().min(1),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  description: z.string().trim().optional(),
});

export async function createMovement(formData: FormData) {
  const data = movementSchema.parse({
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
    type: formData.get("type"),
    date: formData.get("date"),
    amount: formData.get("amount"),
    description: formData.get("description"),
  });

  await prisma.transaction.create({
    data: {
      accountId: data.accountId,
      categoryId: data.categoryId || null,
      type: data.type,
      date: parseLocalDate(data.date),
      amount: data.amount,
      description: data.description || null,
      source: TxSource.MANUAL,
    },
  });

  revalidatePath("/movimientos");
  revalidatePath("/");
  redirect("/movimientos");
}

export async function updateMovement(id: string, formData: FormData) {
  const data = movementSchema.parse({
    accountId: formData.get("accountId"),
    categoryId: formData.get("categoryId"),
    type: formData.get("type"),
    date: formData.get("date"),
    amount: formData.get("amount"),
    description: formData.get("description"),
  });

  await prisma.transaction.update({
    where: { id },
    data: {
      accountId: data.accountId,
      categoryId: data.categoryId || null,
      type: data.type,
      date: parseLocalDate(data.date),
      amount: data.amount,
      description: data.description || null,
    },
  });

  revalidatePath("/movimientos");
  revalidatePath("/");
  redirect("/movimientos");
}

export async function deleteMovement(id: string) {
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/movimientos");
  revalidatePath("/");
}
