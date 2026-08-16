"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
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
    <div className="max-w-sm mx-auto flex flex-col gap-6 pt-4">
      <div className="flex flex-col items-center text-center gap-3">
        <span
          className="icon-badge"
          style={{ width: "3rem", height: "3rem", background: "var(--accent)", color: "var(--accent-foreground)" }}
        >
          <Wallet size={24} strokeWidth={2.25} aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Finanzia</h1>
          <p className="text-sm text-foreground-muted mt-1">
            {mode === "signin" ? "Inicia sesión para continuar" : "Crea tu cuenta para empezar"}
          </p>
        </div>
      </div>

      <div className="surface-card p-5 flex flex-col gap-4">
        <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--surface-sunken)" }}>
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "signin"
                ? "bg-[var(--surface)] text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === "signup"
                ? "bg-[var(--surface)] text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
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