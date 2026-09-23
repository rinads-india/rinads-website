"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { NavGroup, NavLink } from "@/lib/product-ia";

const defaultTriggerClass =
  "rounded-full px-2 py-2 text-[11px] font-semibold tracking-[0.08em] text-[var(--island-foreground)] transition-colors hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary";

type NavDropdownProps = {
  group: NavGroup;
  linkClassName?: string;
};

function ItemContent({ item }: { item: NavLink }) {
  return (
    <>
      <span className="flex items-center gap-2">
        <span className="font-semibold text-[var(--text-primary)]">{item.label}</span>
        {item.status ? (
          <span
            className={
              item.status === "Available"
                ? "rounded-full bg-[var(--status-success-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--status-success-fg)]"
                : "rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]"
            }
          >
            {item.status}
          </span>
        ) : null}
      </span>
      {item.description ? (
        <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">{item.description}</span>
      ) : null}
    </>
  );
}

export function NavDropdown({ group, linkClassName = defaultTriggerClass }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isMega = group.variant === "mega";

  const sections = useMemo(() => {
    const map = new Map<string, NavLink[]>();
    for (const item of group.items) {
      const section = item.section ?? "";
      const current = map.get(section) ?? [];
      current.push(item);
      map.set(section, current);
    }
    return Array.from(map.entries());
  }, [group.items]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const renderLink = (item: NavLink, compact = false) => {
    const className = compact
      ? "block rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
      : "block rounded-xl border border-transparent p-3 transition-colors hover:border-[var(--border)] hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary";

    if (item.href.startsWith("/") && !item.href.includes("#")) {
      return (
        <Link
          key={item.href + item.label}
          href={item.href}
          className={className}
          onClick={() => setOpen(false)}
        >
          <ItemContent item={item} />
        </Link>
      );
    }

    return (
      <a
        key={item.href + item.label}
        href={item.href}
        className={className}
        onClick={() => setOpen(false)}
      >
        <ItemContent item={item} />
      </a>
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className={`${linkClassName} inline-flex items-center gap-1 bg-transparent`}
      >
        {group.label}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open ? (
        <div
          className={`absolute left-1/2 top-[calc(100%+0.75rem)] z-[60] max-h-[76vh] -translate-x-1/2 overflow-y-auto rounded-2xl border border-[var(--island-border)] bg-[var(--island-bg)] p-3 shadow-[var(--island-shadow)] ${
            isMega ? "w-[min(92vw,58rem)]" : "min-w-[18rem] max-w-[22rem]"
          }`}
        >
          {group.href ? (
            <Link
              href={group.href}
              className="mb-2 flex items-center justify-between rounded-xl border-b border-[var(--border)] px-3 py-3 text-sm font-semibold text-rinads-primary transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
              onClick={() => setOpen(false)}
            >
              <span>{group.label} overview</span>
              <span aria-hidden>→</span>
            </Link>
          ) : null}

          {isMega ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map(([section, items]) => (
                <section key={section || "general"} className="rounded-xl p-1">
                  {section ? (
                    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      {section}
                    </p>
                  ) : null}
                  <div className="space-y-1">{items.map((item) => renderLink(item))}</div>
                </section>
              ))}
            </div>
          ) : (
            <div className="space-y-1">{group.items.map((item) => renderLink(item, true))}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
