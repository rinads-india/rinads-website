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
      className="flex h-full flex-col border border-white/10 p-6 transition hover:border-rinads-primary/40"
    >
      <h3 className="text-lg font-bold text-foreground">{name}</h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{summary}</p>
      {formats && formats.length > 0 ? (
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-rinads-primary">
          {formats.join(" · ")}
        </p>
      ) : null}
    </Link>
  );
}
