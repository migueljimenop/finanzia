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
      <button type="submit" className="btn-danger-text">
        Eliminar
      </button>
    </form>
  );
}
