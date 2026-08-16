"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center py-16">
      <h1 className="text-xl font-semibold">Algo salió mal</h1>
      <p className="text-sm text-neutral-500 max-w-md">
        Hubo un error al cargar esta página. Intenta de nuevo y, si persiste, revisa que la
        base de datos esté disponible.
      </p>
      {error.message && (
        <p className="text-xs text-red-600 font-mono break-all max-w-md">{error.message}</p>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-black text-white rounded px-4 py-2 text-sm hover:bg-neutral-800"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="border rounded px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}