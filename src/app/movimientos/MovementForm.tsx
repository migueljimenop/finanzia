"use client";

import { useState } from "react";
import { TxType } from "@/generated/prisma/enums";
import { TX_TYPE_LABELS } from "@/lib/format";

type Account = { id: string; name: string };
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
    <form action={action} className="flex flex-col gap-4 max-w-sm">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Tipo</span>
        <select
          name="type"
          required
          value={type}
          onChange={(e) => setType(e.target.value as TxType)}
          className="border rounded px-3 py-2"
        >
          {Object.values(TxType).map((t) => (
            <option key={t} value={t}>
              {TX_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Cuenta</span>
        <select
          name="accountId"
          required
          defaultValue={defaultValues?.accountId}
          className="border rounded px-3 py-2"
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Categoría</span>
        <select
          name="categoryId"
          defaultValue={defaultValues?.categoryId ?? ""}
          className="border rounded px-3 py-2"
        >
          <option value="">Sin categoría</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Fecha</span>
        <input
          name="date"
          type="date"
          required
          defaultValue={defaultValues?.date ?? new Date().toISOString().slice(0, 10)}
          className="border rounded px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Monto (CLP)</span>
        <input
          name="amount"
          type="number"
          step="1"
          required
          defaultValue={defaultValues?.amount}
          className="border rounded px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Descripción (opcional)</span>
        <input
          name="description"
          type="text"
          defaultValue={defaultValues?.description}
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
