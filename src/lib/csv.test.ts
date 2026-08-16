import { describe, expect, it } from "vitest";
import { parseFlexibleAmount } from "./csv";

describe("parseFlexibleAmount", () => {
  it("parsea enteros planos", () => {
    expect(parseFlexibleAmount("12000")).toBe(12000);
    expect(parseFlexibleAmount("0")).toBe(0);
  });

  it("interpreta separador de miles con punto o coma", () => {
    expect(parseFlexibleAmount("25.000")).toBe(25000);
    expect(parseFlexibleAmount("1.234.567")).toBe(1234567);
    expect(parseFlexibleAmount("1,234,567")).toBe(1234567);
  });

  it("interpreta decimales con un solo separador", () => {
    expect(parseFlexibleAmount("12.56")).toBe(12.56);
    expect(parseFlexibleAmount("12,56")).toBe(12.56);
  });

  it("mezcla separador de miles y decimales (formato europeo/chileno)", () => {
    expect(parseFlexibleAmount("1.234,56")).toBe(1234.56);
    expect(parseFlexibleAmount("1,234.56")).toBe(1234.56);
  });

  it("tolera símbolo de moneda y espacios", () => {
    expect(parseFlexibleAmount("$ 12.500")).toBe(12500);
    expect(parseFlexibleAmount("CLP 30.000")).toBe(30000);
    expect(parseFlexibleAmount("  1.000  ")).toBe(1000);
  });

  it("siempre devuelve valor positivo (el signo lo decide el tipo)", () => {
    expect(parseFlexibleAmount("-123.45")).toBe(123.45);
    expect(parseFlexibleAmount("(50.000)")).toBe(50000);
  });

  it("devuelve null para entradas inválidas o vacías", () => {
    expect(parseFlexibleAmount("")).toBeNull();
    expect(parseFlexibleAmount("   ")).toBeNull();
    expect(parseFlexibleAmount("abc")).toBeNull();
    expect(parseFlexibleAmount("---")).toBeNull();
  });
});