"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { OsCardItem } from "@/lib/os-modules";

type OsCardGridProps = {
  cards: OsCardItem[];
  view?: "home" | "rooms";
};

function CardShell({
  card,
  children,
}: {
  card: OsCardItem;
  children: ReactNode;
}) {
  const sizeClass =
    card.size === "lg"
      ? "md:col-span-2 md:row-span-2 min-h-[180px]"
      : card.size === "md"
        ? "md:col-span-2 min-h-[120px]"
        : "min-h-[100px]";

  const toneClass =
    card.tone === "green"
      ? "os-card-green text-white"
      : card.tone === "muted"
        ? "bg-white/25 text-gray-700"
        : "bg-white/72 text-gray-900";

  const body = (
    <div
      className={`os-glass flex flex-col justify-between rounded-3xl p-4 shadow-sm transition hover:shadow-md ${sizeClass} ${toneClass}`}
    >
      {children}
    </div>
  );

  if (card.href) {
    if (card.external) {
      return (
        <a
          href={card.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
        >
          {body}
        </a>
      );
    }
    return (
      <Link
        href={card.href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary"
      >
        {body}
      </Link>
    );
  }

  return body;
}

export function OsCardGrid({ cards, view = "home" }: OsCardGridProps) {
  const visible =
    view === "rooms"
      ? cards.filter((card) => card.id === "create-room" || card.id === "screen-share")
      : cards;

  return (
    <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((card) => (
        <CardShell key={card.id} card={card}>
          <div>
            <p className="text-sm font-semibold">{card.title}</p>
            <p className="mt-1 text-xs opacity-75">{card.subtitle}</p>
          </div>
          {card.meta && <p className="mt-3 text-lg font-bold">{card.meta}</p>}
          {card.id === "create-room" && (
            <div className="mt-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-gray-400 text-2xl">
              +
            </div>
          )}
          {card.id === "screen-share" && (
            <div className="mt-3 h-24 rounded-2xl bg-gradient-to-br from-sky-200/80 to-emerald-200/70" />
          )}
        </CardShell>
      ))}
    </div>
  );
}
