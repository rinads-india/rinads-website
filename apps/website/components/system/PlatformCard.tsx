import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type PlatformCardProps = {
  title: string;
  description: string;
  href: string;
  eyebrow?: string;
};

export function PlatformCard({ title, description, href, eyebrow }: PlatformCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between border border-rinads-primary/20 bg-black/30 p-6 transition hover:border-rinads-primary/50 hover:bg-rinads-primary/5"
    >
      {eyebrow ? (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-rinads-primary">
          {eyebrow}
        </p>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <ArrowUpRight
          className="shrink-0 text-muted-foreground transition group-hover:text-rinads-primary"
          size={18}
          aria-hidden
        />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </Link>
  );
}
