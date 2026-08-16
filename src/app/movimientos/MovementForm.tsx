"use client";

import { useState } from "react";
import { TxType } from "@/generated/prisma/enums";
import { TX_TYPE_LABELS, accountLabel } from "@/lib/format";

type Account = { id: string; name: string; accountNumber?: string | null };
type Category = { id: string; name: string; kind: TxType };

type Props = {
  action: (formData: FormData) => void;
  accounts: Account[];
  categories: Category[];
  defaultValues?: {
    accountId: string;
    categoryId: string | null;
    type: TxType;
    date: string;
    amount: number;
    description: string;
  };
  submitLabel: string;
};

export function MovementForm({ action, accounts, categories, defaultValues, submitLabel }: Props) {
  const [type, setType] = useState<TxType>(defaultValues?.type ?? TxType.EXPENSE);
  const filteredCategories = categories.filter((c) => c.kind === type);

  return (
    <form action={action} className="flex flex-col gap-5 max-w-sm">
      <label className="flex flex-col gap-1.5">
        <span className="field-label">Tipo</span>
        <select
          name="type"
          required
          value={type}
          onChange={(e) => setType(e.target.value as TxType)}
          className="field-control"
        >
          {Object.values(TxType).map((t) => (
            <option key={t} value={t}>
              {TX_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Cuenta</span>
        <select name="accountId" required defaultValue={defaultValues?.accountId} className="field-control">
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {accountLabel(account)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Categoría</span>
        <select name="categoryId" defaultValue={defaultValues?.categoryId ?? ""} className="field-control">
          <option value="">Sin categoría</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Fecha</span>
        <input
          name="date"
          type="date"
          required
          defaultValue={defaultValues?.date ?? new Date().toISOString().slice(0, 10)}
          className="field-control"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Monto (CLP)</span>
        <input
          name="amount"
          type="number"
          step="1"
          required
          defaultValue={defaultValues?.amount}
          className="field-control"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label">Descripción (opcional)</span>
        <input
          name="description"
          type="text"
          defaultValue={defaultValues?.description}
          className="field-control"
        />
      </label>

      <button type="submit" className="btn btn-primary w-fit">
        {submitLabel}
      </button>
    </form>
  );
}
