import Link from "next/link";
import { AccountForm } from "../AccountForm";
import { createAccount } from "../actions";

export default function NuevaCuentaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/cuentas" className="link-quiet">
          ← Volver a cuentas
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2">Nueva cuenta</h1>
      </div>

      <AccountForm action={createAccount} submitLabel="Crear cuenta" />
    </div>
  );
}
