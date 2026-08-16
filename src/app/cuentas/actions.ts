"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { Bank, AccountType } from "@/generated/prisma/client";

const accountSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  bank: z.enum(Bank),
  type: z.enum(AccountType),
  balance: z.coerce.number().finite(),
  accountNumber: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
});

export async function createAccount(formData: FormData) {
  const userId = await requireUserId();
  const data = accountSchema.parse({
    name: formData.get("name"),
    bank: formData.get("bank"),
    type: formData.get("type"),
    balance: formData.get("balance"),
    accountNumber: formData.get("accountNumber"),
  });

  await prisma.account.create({ data: { ...data, userId } });

  revalidatePath("/cuentas");
  redirect("/cuentas");
}

export async function updateAccount(id: string, formData: FormData) {
  const userId = await requireUserId();
  const data = accountSchema.parse({
    name: formData.get("name"),
    bank: formData.get("bank"),
    type: formData.get("type"),
    balance: formData.get("balance"),
    accountNumber: formData.get("accountNumber"),
  });

  await prisma.account.updateMany({ where: { id, userId }, data });

  revalidatePath("/cuentas");
  redirect("/cuentas");
}

export async function deleteAccount(id: string) {
  const userId = await requireUserId();
  await prisma.account.deleteMany({ where: { id, userId } });
  revalidatePath("/cuentas");
}
