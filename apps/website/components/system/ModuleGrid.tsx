type ModuleGridProps = {
  modules: Array<{ name: string; description?: string }>;
  title?: string;
};

export function ModuleGrid({ modules, title = "Modules" }: ModuleGridProps) {
  return (
    <section className="px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl font-bold text-foreground md:text-3xl">{title}</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((mod) => (
            <div key={mod.name} className="border border-white/10 bg-black/25 px-4 py-4">
              <p className="font-semibold text-foreground">{mod.name}</p>
              {mod.description ? (
                <p className="mt-1 text-sm text-muted-foreground">{mod.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
