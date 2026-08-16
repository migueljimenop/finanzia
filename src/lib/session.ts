import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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
 */
export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}