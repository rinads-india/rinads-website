type IntelligencePanelProps = {
  title: string;
  description: string;
  items: Array<{ name: string; description?: string }>;
};

export function IntelligencePanel({ title, description, items }: IntelligencePanelProps) {
  return (
    <section className="border border-rinads-primary/20 bg-black/35 p-6 md:p-8">
      <h3 className="text-2xl font-bold text-foreground">{title}</h3>
      <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.name} className="border border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{item.name}</p>
            {item.description ? (
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
