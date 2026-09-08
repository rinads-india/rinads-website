type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <div className="border border-white/10 bg-black/30 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">{label}</p>
      <p className="mt-2 text-3xl font-black text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
