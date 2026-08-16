"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { BucketType, CalcMethod } from "@/generated/prisma/client";

const bucketInput = z.object({
  method: z.enum(CalcMethod),
  value: z.coerce.number().min(0),
});

const ruleSchema = z.object({
  investment: bucketInput,
  home: bucketInput,
  credit: bucketInput,
});

export async function saveRule(formData: FormData) {
  const userId = await requireUserId();

  const data = ruleSchema.parse({
    investment: { method: formData.get("investmentMethod"), value: formData.get("investmentValue") },
    home: { method: formData.get("homeMethod"), value: formData.get("homeValue") },
    credit: { method: formData.get("creditMethod"), value: formData.get("creditValue") },
  });

  const existing = await prisma.distributionRule.findFirst({
    where: { userId, isActive: true },
    include: { buckets: true },
  });

  if (existing) {
    const byType = new Map(existing.buckets.map((b) => [b.type, b]));
    await prisma.$transaction([
      prisma.distributionBucket.update({
        where: { id: byType.get(BucketType.INVESTMENT)!.id },
        data: { calcMethod: data.investment.method, value: data.investment.value },
      }),
      prisma.distributionBucket.update({
        where: { id: byType.get(BucketType.HOME_TRANSFER)!.id },
        data: { calcMethod: data.home.method, value: data.home.value },
      }),
      prisma.distributionBucket.update({
        where: { id: byType.get(BucketType.CREDIT_INSTALLMENT)!.id },
        data: { calcMethod: data.credit.method, value: data.credit.value },
      }),
    ]);
  } else {
    await prisma.distributionRule.create({
      data: {
        userId,
        name: "Regla mensual",
        isActive: true,
        buckets: {
          create: [
            { type: BucketType.INVESTMENT, calcMethod: data.investment.method, value: data.investment.value, order: 1 },
            { type: BucketType.HOME_TRANSFER, calcMethod: data.home.method, value: data.home.value, order: 2 },
            { type: BucketType.CREDIT_INSTALLMENT, calcMethod: data.credit.method, value: data.credit.value, order: 3 },
            { type: BucketType.AVAILABLE_MARGIN, calcMethod: CalcMethod.REMAINDER, value: null, order: 4 },
          ],
        },
      },
    });
  }

  revalidatePath("/regla");
  revalidatePath("/ingresos");
  revalidatePath("/");
  redirect("/regla");
}
