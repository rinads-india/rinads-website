"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { NavGroup, NavLink } from "@/lib/product-ia";
import {
  NAV_MENU_GAP_PX,
  NAV_MENU_VIEWPORT_PAD_PX,
  positionMegaMenu,
  positionPlainMenu,
  type MenuBox,
} from "@/lib/nav-menu-position";

const defaultTriggerClass =
  "rounded-full px-2 py-2 text-[11px] font-semibold tracking-[0.08em] text-[var(--island-foreground)] transition-colors hover:text-rinads-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary";

type NavDropdownProps = {
  group: NavGroup;
  linkClassName?: string;
};

type OpenLayout = {
  box: MenuBox;
  backdropTop: number;
};

function ItemContent({ item }: { item: NavLink }) {
  return (
    <>
      <span className="flex items-center gap-2">
        <span className="font-semibold text-[var(--text-primary)]">{item.label}</span>
        {item.status ? (
          <span
            className={
              item.status === "Available" || item.status === "Pilot"
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

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function measureMenuLayout(triggerEl: HTMLElement, isMega: boolean): OpenLayout {
  const trigger = triggerEl.getBoundingClientRect();
  const nav = triggerEl.closest("nav");
  const islandBottom = nav?.getBoundingClientRect().bottom ?? trigger.bottom;
  const viewportWidth = window.innerWidth;

  const box = isMega
    ? positionMegaMenu({
        viewportWidth,
        islandBottom,
        pad: NAV_MENU_VIEWPORT_PAD_PX,
        gap: NAV_MENU_GAP_PX,
      })
    : positionPlainMenu({
        viewportWidth,
        triggerLeft: trigger.left,
        triggerWidth: trigger.width,
        triggerBottom: trigger.bottom,
        pad: NAV_MENU_VIEWPORT_PAD_PX,
        gap: NAV_MENU_GAP_PX,
      });

  return { box, backdropTop: Math.max(0, islandBottom) };
}

export function NavDropdown({ group, linkClassName = defaultTriggerClass }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<OpenLayout | null>(null);
  const triggerWrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMega = group.variant === "mega";
  const mounted = useMounted();

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

  const close = () => {
    setOpen(false);
    setLayout(null);
  };

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    const triggerEl = triggerWrapRef.current;
    if (triggerEl) setLayout(measureMenuLayout(triggerEl, isMega));
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const triggerEl = triggerWrapRef.current;
      if (!triggerEl) return;
      setLayout(measureMenuLayout(triggerEl, isMega));
    };

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, isMega]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerWrapRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    if (isMega) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
      if (isMega) document.body.style.overflow = prevOverflow;
    };
  }, [open, isMega]);

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
          onClick={close}
        >
          <ItemContent item={item} />
        </Link>
      );
    }

    return (
      <a key={item.href + item.label} href={item.href} className={className} onClick={close}>
        <ItemContent item={item} />
      </a>
    );
  };

  const menu =
    open && layout ? (
      <div
        ref={panelRef}
        role="menu"
        style={{
          position: "fixed",
          top: layout.box.top,
          left: layout.box.left,
          width: layout.box.width,
          zIndex: 60,
        }}
        className="max-h-[76vh] overflow-y-auto rounded-2xl border border-[var(--island-border)] bg-[var(--island-bg)] p-3 shadow-[var(--island-shadow)]"
      >
        {group.href ? (
          <Link
            href={group.href}
            className="mb-2 flex items-center justify-between rounded-xl border-b border-[var(--border)] px-3 py-3 text-sm font-semibold text-rinads-primary transition-colors hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
            onClick={close}
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
    ) : null;

  const backdrop =
    open && isMega && layout ? (
      <button
        type="button"
        aria-label="Close menu"
        className="fixed inset-x-0 bottom-0 z-[45] cursor-default bg-black/25 backdrop-blur-[1px]"
        style={{ top: layout.backdropTop }}
        onClick={close}
      />
    ) : null;

  return (
    <div ref={triggerWrapRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={toggle}
        className={`${linkClassName} inline-flex items-center gap-1 bg-transparent`}
      >
        {group.label}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {mounted && (backdrop || menu)
        ? createPortal(
            <>
              {backdrop}
              {menu}
            </>,
            document.body,
          )
        : null}
    </div>
  );
}
