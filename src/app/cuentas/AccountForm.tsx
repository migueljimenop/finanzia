import { Bank, AccountType } from "@/generated/prisma/client";
import { BANK_LABELS, ACCOUNT_TYPE_LABELS } from "@/lib/format";

type Props = {
  action: (formData: FormData) => void;
  defaultValues?: {
    name: string;
    bank: Bank;
    type: AccountType;
    balance: number;
    accountNumber?: string | null;
  };
  submitLabel: string;
};

export function AccountForm({ action, defaultValues, submitLabel }: Props) {
  return (
    <form action={action} className="flex flex-col gap-4 max-w-sm">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Nombre</span>
        <input
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name}
          className="border rounded px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Banco</span>
        <select
          name="bank"
          required
          defaultValue={defaultValues?.bank}
          className="border rounded px-3 py-2"
        >
          {Object.values(Bank).map((bank) => (
            <option key={bank} value={bank}>
              {BANK_LABELS[bank]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Tipo</span>
        <select
          name="type"
          required
          defaultValue={defaultValues?.type}
          className="border rounded px-3 py-2"
        >
          {Object.values(AccountType).map((type) => (
            <option key={type} value={type}>
              {ACCOUNT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          Número de cuenta (opcional)
        </span>
        <input
          name="accountNumber"
          type="text"
          defaultValue={defaultValues?.accountNumber ?? ""}
          placeholder="Ej: 0-000-76-32920-6"
          className="border rounded px-3 py-2"
        />
        <span className="text-xs text-neutral-500">
          Sirve para distinguir varias cuentas del mismo banco al importar
          cartolas — si el archivo trae el número, se detecta solo.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Saldo actual (CLP)</span>
        <input
          name="balance"
          type="number"
          step="1"
          required
          defaultValue={defaultValues?.balance}
          className="border rounded px-3 py-2"
        />
      </label>

      <button
        type="submit"
        className="bg-black text-white rounded px-4 py-2 hover:bg-neutral-800"
      >
        {submitLabel}
      </button>
    </form>
  );
}
