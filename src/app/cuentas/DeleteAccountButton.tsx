"use client";

import { deleteAccount } from "./actions";

export function DeleteAccountButton({ id, name }: { id: string; name: string }) {
  const boundDeleteAccount = deleteAccount.bind(null, id);

  return (
    <form
      action={boundDeleteAccount}
      onSubmit={(e) => {
        if (!confirm(`¿Eliminar la cuenta "${name}"? Esta acción no se puede deshacer.`)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-sm text-red-600 hover:underline">
        Eliminar
      </button>
    </form>
  );
}
