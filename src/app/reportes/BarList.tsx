import { TriangleAlert } from "lucide-react";
import { formatCLP } from "@/lib/format";

type Item = { label: string; amount: number; highlight?: boolean };

const CATEGORICAL_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

export function BarList({ items, emptyLabel }: { items: Item[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-foreground-muted text-sm">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((i) => i.amount), 1);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const color = item.highlight
          ? "var(--status-serious)"
          : CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length];
        return (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm gap-4">
              <span className={item.highlight ? "flex items-center gap-1.5 font-medium" : "flex items-center gap-1.5"}>
                <span
                  aria-hidden
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ background: color }}
                />
                {item.highlight && (
                  <TriangleAlert size={13} strokeWidth={2.5} style={{ color: "var(--status-serious)" }} aria-hidden />
                )}
                {item.label}
              </span>
              <span className="num text-foreground-secondary shrink-0">{formatCLP(item.amount)}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--gridline)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((item.amount / max) * 100, 2)}%`,
                  background: color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
