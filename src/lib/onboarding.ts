import { prisma } from "@/lib/prisma";
import { TxType } from "@/generated/prisma/client";

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Arriendo y gastos del hogar",
  "Alimentación",
  "Transporte",
  "Salud",
  "Entretenimiento",
  "Suscripciones",
  "Otros",
];

/**
 * Crea las categorías por defecto para un usuario que todavía no tiene
 * ninguna (usuario recién registrado, o uno que quedó vacío antes de que
 * existiera este aprovisionamiento). Idempotente: no hace nada si el
 * usuario ya tiene al menos una categoría propia.
 */
export async function ensureDefaultCategories(userId: string): Promise<void> {
  const count = await prisma.category.count({ where: { userId } });
  if (count > 0) return;

  await prisma.category.createMany({
    data: [
      ...DEFAULT_EXPENSE_CATEGORIES.map((name) => ({
        userId,
        name,
        kind: TxType.EXPENSE,
        isSystem: true,
      })),
      { userId, name: "Sueldo", kind: TxType.INCOME, isSystem: true },
    ],
  });
}
