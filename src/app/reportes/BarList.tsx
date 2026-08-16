import { formatCLP } from "@/lib/format";

type Item = { label: string; amount: number; highlight?: boolean };

export function BarList({ items, emptyLabel }: { items: Item[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-foreground-muted text-sm">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((i) => i.amount), 1);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm gap-4">
            <span className={item.highlight ? "flex items-center gap-1.5 font-medium" : ""}>
              {item.highlight && (
                <span aria-hidden className="text-[var(--status-warning)]">
                  ▲
                </span>
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
                background: item.highlight ? "var(--status-warning)" : "var(--accent)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
