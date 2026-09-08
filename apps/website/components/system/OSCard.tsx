import Link from "next/link";

type OSCardProps = {
  name: string;
  description: string;
  href: string;
  modules?: string[];
};

export function OSCard({ name, description, href, modules }: OSCardProps) {
  return (
    <Link
      href={href}
      className="block border border-white/10 bg-surface/40 p-6 transition hover:border-rinads-primary/40"
    >
      <h3 className="text-lg font-bold text-foreground">{name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {modules && modules.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {modules.slice(0, 6).map((m) => (
            <li
              key={m}
              className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-wider text-white/60"
            >
              {m}
            </li>
          ))}
        </ul>
      ) : null}
    </Link>
  );
}
