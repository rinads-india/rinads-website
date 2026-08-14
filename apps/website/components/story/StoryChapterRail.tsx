"use client";

import { useEffect, useState } from "react";

const CHAPTERS = [
  { id: "s-prologue", label: "Prologue", pct: 0.1 },
  { id: "s-gift", label: "01 · The Gift", pct: 0.26 },
  { id: "s-tree", label: "02 · Enlightenment", pct: 0.45 },
  { id: "s-birth", label: "03 · The Birth", pct: 0.62 },
  { id: "s-powers", label: "04 · The Powers", pct: 0.77 },
  { id: "s-dive", label: "Dive In", pct: 0.92 },
];

export function StoryChapterRail() {
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState(CHAPTERS[0].id);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.25, 0.5] }
    );

    CHAPTERS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="story-rail pointer-events-none fixed left-[clamp(14px,3.5vw,28px)] top-0 bottom-0 z-50 w-0.5">
      <div className="story-rail-track absolute inset-0" />
      <div className="story-rail-progress absolute top-0 left-0 w-full" style={{ height: `${progress * 100}%` }} />
      {CHAPTERS.map((chapter) => (
        <div
          key={chapter.id}
          className={`story-chdot ${activeId === chapter.id ? "is-active" : ""}`}
          style={{ top: `${chapter.pct * 100}%` }}
        >
          <i />
          <span>{chapter.label}</span>
        </div>
      ))}
    </div>
  );
}
