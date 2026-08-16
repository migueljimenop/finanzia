"use client";

import { deleteMovement } from "./actions";

export function DeleteMovementButton({ id }: { id: string }) {
  const boundDeleteMovement = deleteMovement.bind(null, id);

  return (
    <form
      action={boundDeleteMovement}
      onSubmit={(e) => {
        if (!confirm("¿Eliminar este movimiento? Esta acción no se puede deshacer.")) {
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
