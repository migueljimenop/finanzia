import { describe, expect, it } from "vitest";
import { parseFlexibleDate, toDateInputValue, parseLocalDate } from "./date";

describe("parseFlexibleDate", () => {
  it("parsea ISO YYYY-MM-DD", () => {
    const d = parseFlexibleDate("2026-08-15");
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(7);
    expect(d?.getDate()).toBe(15);
  });

  it("parsea DD-MM-YYYY y DD/MM/YYYY", () => {
    expect(parseFlexibleDate("15-08-2026")?.getDate()).toBe(15);
    expect(parseFlexibleDate("15/08/2026")?.getMonth()).toBe(7);
  });

  it("tolera días/meses sin cero inicial", () => {
    expect(parseFlexibleDate("5/8/2026")?.getDate()).toBe(5);
  });

  it("devuelve null para fechas no reconocidas y vacías", () => {
    expect(parseFlexibleDate("")).toBeNull();
    expect(parseFlexibleDate("15-ago-2026")).toBeNull();
    expect(parseFlexibleDate("no es fecha")).toBeNull();
  });
});

describe("toDateInputValue", () => {
  it("formatea en hora local a YYYY-MM-DD", () => {
    expect(toDateInputValue(new Date(2026, 7, 3))).toBe("2026-08-03");
  });
});

describe("parseLocalDate", () => {
  it("convierte YYYY-MM-DD a Date local", () => {
    const d = parseLocalDate("2026-02-28");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(28);
  });
});