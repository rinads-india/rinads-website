import Link from "next/link";

type ProjectCardProps = {
  title: string;
  summary: string;
  href?: string;
  tag?: string;
};

export function ProjectCard({ title, summary, href = "/projects", tag }: ProjectCardProps) {
  const inner = (
    <>
      {tag ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">{tag}</p>
      ) : null}
      <h3 className="mt-2 text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{summary}</p>
    </>
  );

  return href ? (
    <Link href={href} className="block border border-white/10 p-5 transition hover:border-rinads-primary/40">
      {inner}
    </Link>
  ) : (
    <div className="border border-white/10 p-5">{inner}</div>
  );
}
