"use client";

import { useMemo, useState, useTransition } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Bank, TxType } from "@/generated/prisma/enums";
import { TX_TYPE_LABELS } from "@/lib/format";
import { parseFlexibleDate, toDateInputValue } from "@/lib/date";
import { parseFlexibleAmount } from "@/lib/csv";
import { detectBankFormat, type BankParseResult, type SheetRow } from "@/lib/bank-parsers";
import { importMovements } from "./actions";

type Account = { id: string; name: string; bank: Bank };
type Category = { id: string; name: string; kind: TxType };

type MappedRow = {
  raw: SheetRow;
  date: Date | null;
  amount: number | null;
  description: string;
};

function isSpreadsheet(file: File) {
  return /\.xlsx?$/i.test(file.name);
}

function readCsv(file: File): Promise<SheetRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: reject,
    });
  });
}

async function readSpreadsheet(file: File): Promise<SheetRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<SheetRow>(sheet, { header: 1, raw: true, blankrows: false });
}

export function ImportWizard({ accounts, categories }: { accounts: Account[]; categories: Category[] }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [rows, setRows] = useState<SheetRow[]>([]);
  const [bankResult, setBankResult] = useState<BankParseResult | null>(null);

  // Solo se usan cuando no se detecta un formato de banco conocido.
  const [type, setType] = useState<TxType>(TxType.EXPENSE);
  const [dateCol, setDateCol] = useState("");
  const [amountCol, setAmountCol] = useState("");
  const [descriptionCol, setDescriptionCol] = useState("");

  const headers = useMemo(() => (rows[0] ?? []).map((h) => String(h ?? "")), [rows]);
  const dataRows = useMemo(() => rows.slice(1), [rows]);
  const filteredCategories = categories.filter((c) => c.kind === type);

  async function handleFile(file: File) {
    setError(null);
    setBankResult(null);
    try {
      const parsedRows = isSpreadsheet(file) ? await readSpreadsheet(file) : await readCsv(file);
      setRows(parsedRows);

      const detected = detectBankFormat(parsedRows);
      if (detected) {
        setBankResult(detected);
        const preselected = accounts.find((a) => a.bank === detected.bank);
        if (preselected) setAccountId(preselected.id);
        return;
      }

      const fields = (parsedRows[0] ?? []).map((h) => String(h ?? ""));
      setDateCol(fields.find((f) => /fecha|date/i.test(f)) ?? fields[0] ?? "");
      setAmountCol(fields.find((f) => /monto|amount|total|cargo/i.test(f)) ?? fields[1] ?? "");
      setDescriptionCol(fields.find((f) => /descrip|detalle|glosa/i.test(f)) ?? "");
    } catch {
      setError("No se pudo leer el archivo. Verifica que sea un CSV, XLS o XLSX válido.");
    }
  }

  const dateColIndex = headers.indexOf(dateCol);
  const amountColIndex = headers.indexOf(amountCol);
  const descriptionColIndex = headers.indexOf(descriptionCol);

  const mappedRows: MappedRow[] = useMemo(() => {
    if (bankResult || dateColIndex < 0 || amountColIndex < 0) return [];
    return dataRows.map((raw) => {
      const dateCell = raw[dateColIndex];
      const date = dateCell instanceof Date ? dateCell : parseFlexibleDate(String(dateCell ?? ""));
      const amountCell = raw[amountColIndex];
      const amount =
        typeof amountCell === "number" ? amountCell : parseFlexibleAmount(String(amountCell ?? ""));
      return {
        raw,
        date,
        amount,
        description: descriptionColIndex >= 0 ? String(raw[descriptionColIndex] ?? "") : "",
      };
    });
  }, [dataRows, dateColIndex, amountColIndex, descriptionColIndex, bankResult]);

  const validRows = mappedRows.filter((r) => r.date && r.amount !== null);
  const invalidCount = mappedRows.length - validRows.length;

  function handleImport() {
    setError(null);
    startTransition(async () => {
      try {
        const rowsToSubmit = bankResult
          ? bankResult.movements.map((m) => ({
              date: toDateInputValue(m.date),
              amount: m.amount,
              description: m.description,
              type: m.type,
            }))
          : validRows.map((r) => ({
              date: toDateInputValue(r.date as Date),
              amount: r.amount as number,
              description: r.description,
              type,
            }));

        await importMovements({
          accountId,
          categoryId: categoryId || null,
          rows: rowsToSubmit,
        });
      } catch (err) {
        if (err instanceof Error && err.message !== "NEXT_REDIRECT") {
          setError(err.message);
        }
      }
    });
  }

  const readyCount = bankResult ? bankResult.movements.length : validRows.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 max-w-sm">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Archivo (CSV, XLS o XLSX)</span>
          <input
            type="file"
            accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="border rounded px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Cuenta</span>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        {!bankResult && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Tipo (se aplica a todas las filas)</span>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as TxType);
                setCategoryId("");
              }}
              className="border rounded px-3 py-2"
            >
              {Object.values(TxType).map((t) => (
                <option key={t} value={t}>
                  {TX_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Categoría (opcional, se aplica a todas las filas)</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Sin categoría</option>
            {(bankResult ? categories : filteredCategories).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {bankResult && (
        <p className="text-sm text-green-700 dark:text-green-500">
          Formato reconocido: {bankResult.bankLabel}. Fecha, monto y tipo (gasto,
          ingreso o transferencia) de cada fila se detectaron automáticamente.
        </p>
      )}

      {!bankResult && headers.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Columna de fecha</span>
            <select
              value={dateCol}
              onChange={(e) => setDateCol(e.target.value)}
              className="border rounded px-3 py-2"
            >
              {headers.map((h, i) => (
                <option key={i} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Columna de monto</span>
            <select
              value={amountCol}
              onChange={(e) => setAmountCol(e.target.value)}
              className="border rounded px-3 py-2"
            >
              {headers.map((h, i) => (
                <option key={i} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Columna de descripción</span>
            <select
              value={descriptionCol}
              onChange={(e) => setDescriptionCol(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option value="">Ninguna</option>
              {headers.map((h, i) => (
                <option key={i} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {(bankResult || headers.length > 0) && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">
              Previsualización ({readyCount} filas listas
              {!bankResult && invalidCount > 0
                ? `, ${invalidCount} se omitirán por fecha o monto inválido`
                : ""}
              {bankResult && bankResult.skippedRows > 0
                ? `, ${bankResult.skippedRows} se omitieron por no traer fecha o monto`
                : ""}
              )
            </h2>
            <div className="border rounded overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-100 dark:bg-neutral-900 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Fecha</th>
                    <th className="px-4 py-2">Monto</th>
                    <th className="px-4 py-2">Descripción</th>
                    <th className="px-4 py-2">{bankResult ? "Tipo" : "Estado"}</th>
                  </tr>
                </thead>
                <tbody>
                  {bankResult
                    ? bankResult.movements.slice(0, 50).map((m, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2">{toDateInputValue(m.date)}</td>
                          <td className="px-4 py-2">{m.amount}</td>
                          <td className="px-4 py-2">{m.description || "—"}</td>
                          <td className="px-4 py-2">{TX_TYPE_LABELS[m.type]}</td>
                        </tr>
                      ))
                    : mappedRows.slice(0, 50).map((row, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2">{String(row.raw[dateColIndex] ?? "")}</td>
                          <td className="px-4 py-2">{String(row.raw[amountColIndex] ?? "")}</td>
                          <td className="px-4 py-2">{row.description || "—"}</td>
                          <td className="px-4 py-2">
                            {row.date && row.amount !== null ? (
                              <span className="text-green-600">OK</span>
                            ) : (
                              <span className="text-red-600">Inválida</span>
                            )}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            type="button"
            onClick={handleImport}
            disabled={isPending || readyCount === 0 || !accountId}
            className="bg-black text-white rounded px-4 py-2 w-fit hover:bg-neutral-800 disabled:opacity-50"
          >
            {isPending ? "Importando..." : `Importar ${readyCount} movimientos`}
          </button>
        </div>
      )}
    </div>
  );
}
