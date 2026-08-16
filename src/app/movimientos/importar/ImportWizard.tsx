"use client";

import { useMemo, useState, useTransition } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Bank, TxType } from "@/generated/prisma/enums";
import { TX_TYPE_LABELS, accountLabel } from "@/lib/format";
import { parseFlexibleDate, toDateInputValue } from "@/lib/date";
import { parseFlexibleAmount } from "@/lib/csv";
import { detectBankFormat, type BankParseResult, type SheetRow } from "@/lib/bank-parsers";
import { importMovements } from "./actions";

type Account = { id: string; name: string; bank: Bank; accountNumber?: string | null };
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
        const sameBankAccounts = accounts.filter((a) => a.bank === detected.bank);
        const exactMatch = detected.accountNumber
          ? sameBankAccounts.find((a) => a.accountNumber === detected.accountNumber)
          : undefined;
        // Si el archivo trae número de cuenta pero ninguna cuenta existente calza,
        // no adivinamos: puede haber más de una cuenta del mismo banco.
        const preselected = exactMatch ?? (detected.accountNumber ? undefined : sameBankAccounts[0]);
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
      <div className="surface-card p-5 flex flex-col gap-4 max-w-sm">
        <label className="flex flex-col gap-1.5">
          <span className="field-label">Archivo (CSV, XLS o XLSX)</span>
          <input
            type="file"
            accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="field-control file:mr-3 file:rounded-md file:border-0 file:bg-foreground file:text-background file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="field-label">Cuenta</span>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="field-control">
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {accountLabel(account)}
              </option>
            ))}
          </select>
        </label>

        {!bankResult && (
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Tipo (se aplica a todas las filas)</span>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as TxType);
                setCategoryId("");
              }}
              className="field-control"
            >
              {Object.values(TxType).map((t) => (
                <option key={t} value={t}>
                  {TX_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="field-label">Categoría (opcional, se aplica a todas las filas)</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field-control">
            <option value="">Sin categoría</option>
            {(bankResult ? categories : filteredCategories).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="text-sm text-[var(--status-critical)]">{error}</p>}

      {bankResult && (
        <div className="flex flex-col gap-2">
          <span className="badge-good w-fit">
            <span className="status-dot bg-current" />
            Formato reconocido: {bankResult.bankLabel}
          </span>
          {bankResult.accountNumber && (
            <p className="text-sm text-foreground-muted">
              N° de cuenta detectado en el archivo: {bankResult.accountNumber}
              {!accounts.some(
                (a) => a.bank === bankResult.bank && a.accountNumber === bankResult.accountNumber
              ) &&
                " — ninguna cuenta registrada tiene este número, revisa que hayas elegido la correcta o créala en Cuentas."}
            </p>
          )}
        </div>
      )}

      {!bankResult && headers.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="field-label">Columna de fecha</span>
            <select value={dateCol} onChange={(e) => setDateCol(e.target.value)} className="field-control">
              {headers.map((h, i) => (
                <option key={i} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="field-label">Columna de monto</span>
            <select value={amountCol} onChange={(e) => setAmountCol(e.target.value)} className="field-control">
              {headers.map((h, i) => (
                <option key={i} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="field-label">Columna de descripción</span>
            <select
              value={descriptionCol}
              onChange={(e) => setDescriptionCol(e.target.value)}
              className="field-control"
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
            <h2 className="text-base font-semibold tracking-tight mb-2">
              Previsualización ({readyCount} filas listas
              {!bankResult && invalidCount > 0
                ? `, ${invalidCount} se omitirán por fecha o monto inválido`
                : ""}
              {bankResult && bankResult.skippedRows > 0
                ? `, ${bankResult.skippedRows} se omitieron por no traer fecha o monto`
                : ""}
              )
            </h2>
            <div className="surface-card overflow-x-auto max-h-96 overflow-y-auto">
              <table className="data-table">
                <thead className="sticky top-0 bg-surface">
                  <tr>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Descripción</th>
                    <th>{bankResult ? "Tipo" : "Estado"}</th>
                  </tr>
                </thead>
                <tbody>
                  {bankResult
                    ? bankResult.movements.slice(0, 50).map((m, i) => (
                        <tr key={i}>
                          <td className="whitespace-nowrap">{toDateInputValue(m.date)}</td>
                          <td className="num whitespace-nowrap">{m.amount}</td>
                          <td>{m.description || "—"}</td>
                          <td className="whitespace-nowrap text-foreground-secondary">
                            {TX_TYPE_LABELS[m.type]}
                          </td>
                        </tr>
                      ))
                    : mappedRows.slice(0, 50).map((row, i) => (
                        <tr key={i}>
                          <td className="whitespace-nowrap">{String(row.raw[dateColIndex] ?? "")}</td>
                          <td className="num whitespace-nowrap">{String(row.raw[amountColIndex] ?? "")}</td>
                          <td>{row.description || "—"}</td>
                          <td className="whitespace-nowrap">
                            {row.date && row.amount !== null ? (
                              <span className="badge-good">OK</span>
                            ) : (
                              <span className="badge-critical">Inválida</span>
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
            className="btn btn-primary w-fit"
          >
            {isPending ? "Importando..." : `Importar ${readyCount} movimientos`}
          </button>
        </div>
      )}
    </div>
  );
}
