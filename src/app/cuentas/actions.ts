"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
  const data = accountSchema.parse({
    name: formData.get("name"),
    bank: formData.get("bank"),
    type: formData.get("type"),
    balance: formData.get("balance"),
    accountNumber: formData.get("accountNumber"),
  });

  await prisma.account.create({ data });

  revalidatePath("/cuentas");
  redirect("/cuentas");
}

export async function updateAccount(id: string, formData: FormData) {
  const data = accountSchema.parse({
    name: formData.get("name"),
    bank: formData.get("bank"),
    type: formData.get("type"),
    balance: formData.get("balance"),
    accountNumber: formData.get("accountNumber"),
  });

  await prisma.account.update({ where: { id }, data });

  revalidatePath("/cuentas");
  redirect("/cuentas");
}

export async function deleteAccount(id: string) {
  await prisma.account.delete({ where: { id } });
  revalidatePath("/cuentas");
}
