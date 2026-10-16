import type { ReactNode } from "react";

type CompanyOsPanelProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
};

export function CompanyOsPanel({
  title,
  description,
  children,
  className = "",
  id,
}: CompanyOsPanelProps) {
  return (
    <section
      id={id}
      className={`os-glass rounded-3xl p-5 sm:p-6 ${className}`}
    >
      {(title || description) && (
        <header className="mb-4">
          {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

export function CompanyOsDemoNotice() {
  return (
    <p className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
      Sample demo data from <code className="text-[11px]">@rinads/company-os</code> — not live
      tenant KPIs. Metrics marked unavailable are omitted from production reads until wired.
    </p>
  );
}
