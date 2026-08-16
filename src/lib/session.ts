import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ensureDefaultCategories } from "@/lib/onboarding";

/** Sesión actual (getSession de Better Auth) o null si no hay usuario. */
export async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
}

/** Parámetros Prisma para filtrar por el usuario actual. */
export type AuthScoped = { userId: string };

/**
 * Devuelve el id del usuario logueado o redirige a /login. Usarlo al inicio
 * de páginas y server actions privadas.
 *
 * De paso, aprovisiona las categorías por defecto si el usuario todavía no
 * tiene ninguna (recién registrado, o uno que quedó vacío antes de que
 * existiera este aprovisionamiento).
 */
export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  await ensureDefaultCategories(session.user.id);
  return session.user.id;
}
