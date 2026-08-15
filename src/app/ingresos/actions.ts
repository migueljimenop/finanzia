"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { computeDistribution } from "@/lib/distribution";
import { parseLocalDate } from "@/lib/date";

const incomeSchema = z.object({
  accountId: z.string().min(1),
  ruleId: z.string().min(1),
  date: z.string().min(1),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  description: z.string().trim().optional(),
});

export async function registerIncome(formData: FormData) {
  const data = incomeSchema.parse({
    accountId: formData.get("accountId"),
    ruleId: formData.get("ruleId"),
    date: formData.get("date"),
    amount: formData.get("amount"),
    description: formData.get("description"),
  });

  const rule = await prisma.distributionRule.findUnique({
    where: { id: data.ruleId },
    include: { buckets: true },
  });

  if (!rule) throw new Error("Regla de distribución no encontrada");

  const distribution = computeDistribution(
    data.amount,
    rule.buckets.map((b) => ({
      id: b.id,
      type: b.type,
      calcMethod: b.calcMethod,
      value: b.value ? Number(b.value) : null,
      order: b.order,
    }))
  );

  await prisma.$transaction(async (tx) => {
    const income = await tx.income.create({
      data: {
        accountId: data.accountId,
        ruleId: data.ruleId,
        date: parseLocalDate(data.date),
        amount: data.amount,
        description: data.description || null,
      },
    });

    await tx.incomeDistribution.createMany({
      data: distribution.map((d) => ({
        incomeId: income.id,
        bucketId: d.bucketId,
        type: d.type,
        amount: d.amount,
      })),
    });

    await tx.account.update({
      where: { id: data.accountId },
      data: { balance: { increment: data.amount } },
    });
  });

  revalidatePath("/ingresos");
  revalidatePath("/");
  redirect("/ingresos");
}
