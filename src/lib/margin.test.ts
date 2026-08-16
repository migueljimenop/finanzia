import { beforeEach, describe, expect, it, vi } from "vitest";
import { TxType } from "@/generated/prisma/client";

const mocks = vi.hoisted(() => ({
  incomeAggregate: vi.fn(),
  txAggregate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    incomeDistribution: { aggregate: mocks.incomeAggregate },
    transaction: { aggregate: mocks.txAggregate },
  },
}));

import { getMarginSummary } from "./margin";
import { getMonthEndForecast } from "./forecast";

beforeEach(() => {
  mocks.incomeAggregate.mockReset();
  mocks.txAggregate.mockReset();
});

describe("getMarginSummary", () => {
  it("incluye la tarjeta Falabella en el gasto disponible (scoping)", async () => {
    mocks.incomeAggregate.mockResolvedValue({ _sum: { amount: 500000 } });
    mocks.txAggregate.mockResolvedValue({ _sum: { amount: 120000 } });

    const margin = await getMarginSummary("user-1", new Date(2026, 7, 1));

    expect(margin.monthlyMargin).toBe(500000);
    expect(margin.spent).toBe(120000);
    expect(margin.remaining).toBe(380000);
    expect(margin.daysRemaining).toBe(31);

    const where = mocks.txAggregate.mock.calls[0][0].where;
    expect(where.type).toBe(TxType.EXPENSE);
    expect(where.userId).toBe("user-1");
    // El OR de cuentas debe incluir explícitamente Falabella.
    const banks = where.OR.map((o: { account: { bank: string } }) => o.account.bank);
    expect(banks).toContain("FALABELLA");
    expect(banks).toContain("SANTANDER");
    expect(banks).toContain("BANCO_CHILE");
    expect(banks).not.toContain("MERCADO_PAGO");
  });
});

describe("getMonthEndForecast", () => {
  it("extrapola el ritmo de gasto actual al total del mes", async () => {
    mocks.incomeAggregate.mockResolvedValue({ _sum: { amount: 500000 } });
    mocks.txAggregate.mockResolvedValue({ _sum: { amount: 120000 } });

    const forecast = await getMonthEndForecast("user-1", new Date(2026, 7, 10));

    // margen 500000, gastado 120000 hasta el día 10 de un mes de 31 días.
    expect(forecast.daysElapsed).toBe(10);
    expect(forecast.daysInMonth).toBe(31);
    expect(forecast.projectedSpend).toBe(372000);
    expect(forecast.projectedRemaining).toBe(128000);
    expect(forecast.onTrack).toBe(true);
  });

  it("advierte cuando el ritmo proyectado supera el margen", async () => {
    mocks.incomeAggregate.mockResolvedValue({ _sum: { amount: 100000 } });
    mocks.txAggregate.mockResolvedValue({ _sum: { amount: 60000 } });

    const forecast = await getMonthEndForecast("user-1", new Date(2026, 7, 10));
    // 60000 / 10 días = 6000/día -> 186000 al mes > margen 100000.
    expect(forecast.projectedRemaining).toBeLessThan(0);
    expect(forecast.onTrack).toBe(false);
  });
});