import Link from "next/link";

type VerticalCardProps = {
  name: string;
  type: string;
  summary: string;
  href: string;
  status?: "available" | "coming";
};

export function VerticalCard({ name, type, summary, href, status = "coming" }: VerticalCardProps) {
  return (
    <Link
      href={href}
      className="block border border-white/10 p-6 transition hover:border-rinads-primary/40"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{type}</p>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider ${
            status === "available" ? "text-emerald-400" : "text-white/40"
          }`}
        >
          {status === "available" ? "Available" : "Coming soon"}
        </span>
      </div>
      <h3 className="mt-3 text-lg font-bold text-foreground">{name}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{summary}</p>
    </Link>
  );
}
