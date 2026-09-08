type IntegrationCardProps = {
  name: string;
  category: string;
};

export function IntegrationCard({ name, category }: IntegrationCardProps) {
  return (
    <div className="border border-white/10 px-4 py-3">
      <p className="text-sm font-semibold text-foreground">{name}</p>
      <p className="mt-1 text-xs text-muted-foreground">{category}</p>
    </div>
  );
}
