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
    <form action={action} className="flex flex-col gap-5 max-w-sm">
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Nombre</span>
        <input
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name}
          className="field-control"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Banco</span>
        <select name="bank" required defaultValue={defaultValues?.bank} className="field-control">
          {Object.values(Bank).map((bank) => (
            <option key={bank} value={bank}>
              {BANK_LABELS[bank]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Tipo</span>
        <select name="type" required defaultValue={defaultValues?.type} className="field-control">
          {Object.values(AccountType).map((type) => (
            <option key={type} value={type}>
              {ACCOUNT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Número de cuenta (opcional)</span>
        <input
          name="accountNumber"
          type="text"
          defaultValue={defaultValues?.accountNumber ?? ""}
          placeholder="Ej: 0-000-76-32920-6"
          className="field-control"
        />
        <span className="field-hint">
          Sirve para distinguir varias cuentas del mismo banco al importar cartolas — si el
          archivo trae el número, se detecta solo.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Saldo actual (CLP)</span>
        <input
          name="balance"
          type="number"
          step="1"
          required
          defaultValue={defaultValues?.balance}
          className="field-control"
        />
      </label>

      <button type="submit" className="btn btn-primary w-fit">
        {submitLabel}
      </button>
    </form>
  );
}
