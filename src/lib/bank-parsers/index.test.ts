import { describe, expect, it } from "vitest";
import { detectBankFormat } from "./index";

describe("santanderParser", () => {
  it("reconoce cartola y clasifica cargo/abono", () => {
    const rows: unknown[][] = [
      ["JUAN PEREZ GARZON"],
      ["N° CUENTA 123456"],
      ["Fecha", "Detalle", "Monto cargo ($)", "Monto abono ($)", "Saldo ($)"],
      ["12-08-2026", "Supermercado Jumbo", "45000", "", "12000"],
      ["13-08-2026", "Abono sueldo", "", "800000", "812000"],
      ["", "", "", "", ""],
    ];

    const result = detectBankFormat(rows);
    expect(result?.bankId).toBe("santander");
    expect(result?.movements).toHaveLength(2);
    expect(result?.movements[0]).toMatchObject({
      amount: 45000,
      type: "EXPENSE",
      description: "Supermercado Jumbo",
    });
    expect(result?.movements[1]).toMatchObject({ amount: 800000, type: "INCOME" });
  });
});

describe("bancoDeChileParser", () => {
  it("ignora la metadata previa y clasifica cargo/abono", () => {
    const rows: unknown[][] = [
      ["TITULAR: JUAN PEREZ"],
      ["RUT 11.111.111-1"],
      ["N° CUENTA 555555"],
      ["Fecha", "Descripción", "Canal o Sucursal", "Cargos (CLP)", "Abonos (CLP)", "Saldo (CLP)"],
      ["15/08/2026", "Compra Farmacia", "WEB", "12000", "", "88000"],
      ["16/08/2026", "Transferencia recibida", "APP", "", "50000", "138000"],
      ["", "Documento de resumen", "", "", "", ""],
    ];

    const result = detectBankFormat(rows);
    expect(result?.bankId).toBe("banco_chile");
    expect(result?.movements).toHaveLength(2);
    expect(result?.movements[0]).toMatchObject({ amount: 12000, type: "EXPENSE" });
    expect(result?.movements[1]).toMatchObject({ amount: 50000, type: "INCOME" });
    expect(result?.skippedRows).toBe(0);
  });
});

describe("falabellaParser", () => {
  it("trata PAGO como transferencia y el resto como gasto", () => {
    const rows: unknown[][] = [
      ["Fecha", "Descripcion", "Titular", "Monto", "Cuotas pendientes", "Valor cuota"],
      [new Date(2026, 7, 5), "PAGO TARJETA CMR", "", 50000, "", ""],
      [new Date(2026, 7, 6), "Apple Store", "", 120000, "", ""],
    ];

    const result = detectBankFormat(rows);
    expect(result?.bankId).toBe("falabella");
    expect(result?.movements).toHaveLength(2);
    expect(result?.movements[0]).toMatchObject({ amount: 50000, type: "TRANSFER" });
    expect(result?.movements[1]).toMatchObject({ amount: 120000, type: "EXPENSE" });
  });
});

describe("detectBankFormat", () => {
  it("devuelve null para un archivo genérico sin formato conocido", () => {
    const rows: unknown[][] = [
      ["col1", "col2", "col3"],
      ["a", "b", "c"],
      ["d", "e", "f"],
    ];
    expect(detectBankFormat(rows)).toBeNull();
  });
});