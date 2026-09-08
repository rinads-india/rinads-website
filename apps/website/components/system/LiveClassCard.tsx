type LiveClassCardProps = {
  title: string;
  schedule: string;
  mode: string;
};

export function LiveClassCard({ title, schedule, mode }: LiveClassCardProps) {
  return (
    <div className="border border-rinads-primary/20 bg-black/30 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">{mode}</p>
      <h3 className="mt-2 text-base font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{schedule}</p>
    </div>
  );
}
