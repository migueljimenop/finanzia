import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Pool acotado: con el default Prisma abre más conexiones de las que tolera el
// Postgres administrado de `prisma dev` bajo carga concurrente, y éste las
// cierra (P1017 / "Connection terminated"). Un tope pequeño + idle timeout
// evita ese agotamiento; el mismo pool encola peticiones con normalidad.
const POOL_MAX = Number(process.env.PRISMA_POOL_MAX ?? 5);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: POOL_MAX,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
});

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
