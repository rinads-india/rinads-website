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
      className="group block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:-translate-y-0.5 hover:border-rinads-primary/45 hover:shadow-[0_16px_40px_rgba(159,75,199,0.10)]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-rinads-primary">{verb}</p>
      <h3 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{name}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{summary}</p>
    </Link>
  );
}
