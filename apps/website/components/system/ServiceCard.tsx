import Link from "next/link";

type ServiceCardProps = {
  name: string;
  verb: string;
  summary: string;
  href: string;
};

export function ServiceCard({ name, verb, summary, href }: ServiceCardProps) {
  return (
    <Link
      href={href}
      className="group block border border-white/10 p-6 transition hover:border-rinads-primary/45"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rinads-primary">{verb}</p>
      <h3 className="mt-2 text-xl font-bold text-foreground group-hover:text-white">{name}</h3>
      <p className="mt-3 text-sm text-muted-foreground">{summary}</p>
    </Link>
  );
}
