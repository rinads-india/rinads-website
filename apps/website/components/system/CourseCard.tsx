import Link from "next/link";

type CourseCardProps = {
  name: string;
  summary: string;
  href: string;
  formats?: string[];
};

export function CourseCard({ name, summary, href, formats }: CourseCardProps) {
  return (
    <Link
      href={href}
      className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:-translate-y-0.5 hover:border-rinads-primary/40 hover:shadow-[0_16px_40px_rgba(159,75,199,0.10)]"
    >
      <h3 className="text-lg font-bold text-[var(--text-primary)]">{name}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-muted)]">{summary}</p>
      {formats && formats.length > 0 ? (
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-rinads-primary">
          {formats.join(" · ")}
        </p>
      ) : null}
    </Link>
  );
}
