"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { NavGroup } from "@/lib/product-ia";

const islandLinkClass =
  "block rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--island-foreground)] transition-colors hover:bg-black/5 hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary";

type NavDropdownProps = {
  group: NavGroup;
  linkClassName?: string;
};

export function NavDropdown({ group, linkClassName = islandLinkClass }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
      {open && (
        <div className="absolute left-1/2 top-[calc(100%+0.5rem)] z-[60] min-w-[12rem] -translate-x-1/2 rounded-2xl border border-[var(--island-border)] bg-[var(--island-bg)] p-2 shadow-[var(--island-shadow)]">
          {group.items.map((item) =>
            item.href.startsWith("/") && !item.href.includes("#") ? (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={linkClassName}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.href + item.label}
                href={item.href}
                className={linkClassName}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}
