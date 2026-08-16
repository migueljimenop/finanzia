"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    try {
      const result =
        mode === "signin"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ name, email, password });

      if (result.error) {
        setError(result.error.message ?? "No se pudo completar la operación.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Ocurrió un error inesperado.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Finanzia</h1>
        <p className="text-sm text-foreground-muted mt-1">
          {mode === "signin" ? "Inicia sesión para continuar" : "Crea tu cuenta para empezar"}
        </p>
      </div>

      <div className="surface-card p-5 flex flex-col gap-4">
        <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
            className={`flex-1 py-2 text-sm font-medium ${mode === "signin" ? "bg-foreground text-background" : "text-foreground-muted"}`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`flex-1 py-2 text-sm font-medium ${mode === "signup" ? "bg-foreground text-background" : "text-foreground-muted"}`}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <label className="flex flex-col gap-1.5">
              <span className="field-label">Nombre</span>
              <input
                name="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field-control"
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="field-label">Correo</span>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-control"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="field-label">Contraseña</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-control"
            />
          </label>

          {error && <p className="text-sm text-[var(--status-critical)]">{error}</p>}

          <button type="submit" disabled={isPending} className="btn btn-primary w-full">
            {isPending
              ? "Procesando..."
              : mode === "signin"
                ? "Entrar"
                : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}