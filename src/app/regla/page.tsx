import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { BucketType, CalcMethod } from "@/generated/prisma/client";
import { CALC_METHOD_LABELS } from "@/lib/format";
import { saveRule } from "./actions";

export const dynamic = "force-dynamic";

export default async function ReglaPage() {
  const userId = await requireUserId();

  const rule = await prisma.distributionRule.findFirst({
    where: { userId, isActive: true },
    include: { buckets: true },
  });

  const bucketByType = new Map(rule?.buckets.map((b) => [b.type, b]));
  const investment = bucketByType.get(BucketType.INVESTMENT);
  const home = bucketByType.get(BucketType.HOME_TRANSFER);
  const credit = bucketByType.get(BucketType.CREDIT_INSTALLMENT);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Regla de distribución</h1>
        <p className="text-sm text-foreground-muted mt-1">
          Define cómo se reparte tu sueldo apenas lo registras en{" "}
          <span className="font-medium text-foreground">Ingresos</span>. El margen de gasto
          disponible es siempre lo que queda después de estos tres sobres — no hace falta
          configurarlo.
        </p>
      </div>

      <form action={saveRule} className="surface-card p-5 flex flex-col gap-6 max-w-md">
        <BucketFields
          label="Inversión"
          methodName="investmentMethod"
          valueName="investmentValue"
          defaultMethod={investment?.calcMethod ?? CalcMethod.FIXED_AMOUNT}
          defaultValue={investment ? Number(investment.value) : undefined}
        />
        <BucketFields
          label="Hogar (transferencia, ej. Mercado Pago)"
          methodName="homeMethod"
          valueName="homeValue"
          defaultMethod={home?.calcMethod ?? CalcMethod.PERCENTAGE}
          defaultValue={home ? Number(home.value) : undefined}
        />
        <BucketFields
          label="Cuota de crédito"
          methodName="creditMethod"
          valueName="creditValue"
          defaultMethod={credit?.calcMethod ?? CalcMethod.FIXED_AMOUNT}
          defaultValue={credit ? Number(credit.value) : undefined}
        />

        <div className="rounded-lg p-3" style={{ background: "var(--background)" }}>
          <p className="field-label">Margen de gasto disponible</p>
          <p className="text-sm text-foreground-secondary mt-1">
            Resto del sueldo después de los tres sobres de arriba.
          </p>
        </div>

        <button type="submit" className="btn btn-primary w-fit">
          {rule ? "Guardar cambios" : "Crear regla"}
        </button>
      </form>

      {!rule && (
        <p className="text-sm text-foreground-muted">
          Aún no tienes una regla activa — sin ella no puedes registrar ingresos. Los valores de
          arriba son solo un punto de partida, ajústalos a tu caso antes de guardar.
        </p>
      )}
    </div>
  );
}

function BucketFields({
  label,
  methodName,
  valueName,
  defaultMethod,
  defaultValue,
}: {
  label: string;
  methodName: string;
  valueName: string;
  defaultMethod: CalcMethod;
  defaultValue?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="field-label">{label}</span>
      <div className="flex gap-3">
        <select name={methodName} defaultValue={defaultMethod} className="field-control">
          <option value={CalcMethod.FIXED_AMOUNT}>{CALC_METHOD_LABELS[CalcMethod.FIXED_AMOUNT]}</option>
          <option value={CalcMethod.PERCENTAGE}>{CALC_METHOD_LABELS[CalcMethod.PERCENTAGE]}</option>
        </select>
        <input
          name={valueName}
          type="number"
          step="1"
          min="0"
          required
          defaultValue={defaultValue}
          className="field-control"
        />
      </div>
    </div>
  );
}
