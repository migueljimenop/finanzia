import { requireUserId } from "@/lib/session";
import { BackLink } from "../../BackLink";
import { AccountForm } from "../AccountForm";
import { createAccount } from "../actions";

export default async function NuevaCuentaPage() {
  await requireUserId();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackLink href="/cuentas" label="Volver a cuentas" />
        <h1 className="text-2xl font-semibold tracking-tight mt-2">Nueva cuenta</h1>
      </div>

      <AccountForm action={createAccount} submitLabel="Crear cuenta" />
    </div>
  );
}
