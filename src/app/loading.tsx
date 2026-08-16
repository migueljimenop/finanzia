export default function LoadingPage() {
  return (
    <div className="flex flex-col gap-6 animate-pulse" aria-busy="true">
      <div className="h-7 w-48 rounded" style={{ background: "var(--gridline)" }} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="surface-card p-4 space-y-2">
            <div className="h-4 w-24 rounded" style={{ background: "var(--gridline)" }} />
            <div className="h-6 w-28 rounded" style={{ background: "var(--gridline)" }} />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-5 w-40 rounded" style={{ background: "var(--gridline)" }} />
        <div className="h-24 w-full rounded" style={{ background: "var(--gridline)" }} />
        <div className="h-24 w-full rounded" style={{ background: "var(--gridline)" }} />
      </div>
    </div>
  );
}
