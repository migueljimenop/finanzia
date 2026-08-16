import { formatCLP } from "@/lib/format";

type Item = { label: string; amount: number; highlight?: boolean };

export function BarList({ items, emptyLabel }: { items: Item[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-neutral-500 text-sm">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((i) => i.amount), 1);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className={item.highlight ? "font-medium text-amber-700 dark:text-amber-500" : ""}>
              {item.label}
            </span>
            <span className="text-neutral-500">{formatCLP(item.amount)}</span>
          </div>
          <div className="h-2 bg-neutral-100 dark:bg-neutral-900 rounded overflow-hidden">
            <div
              className={`h-full rounded ${item.highlight ? "bg-amber-600" : "bg-neutral-700 dark:bg-neutral-400"}`}
              style={{ width: `${Math.max((item.amount / max) * 100, 2)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
