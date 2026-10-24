"use client";

import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { useRinpo } from "./RinpoProvider";

const RINPO_AVATAR = "/assets/rinpo-full-body-transparent-v2.png";

export function RinpoCornerLauncher() {
  const { phoneOpen, togglePhone, interactionState } = useRinpo();

  if (phoneOpen) return null;

  const active = interactionState !== "closed";

  return (
    <div
      className="fixed z-[46] flex flex-col items-end gap-1"
      style={{
        right: "max(10px, env(safe-area-inset-right, 10px))",
        bottom: "max(12px, env(safe-area-inset-bottom, 12px))",
      }}
      data-rinpo-corner-launcher
    >
      <button
        type="button"
        onClick={togglePhone}
        className="group relative grid h-[104px] w-[76px] place-items-end overflow-visible rounded-[1.6rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rinads-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:h-[128px] sm:w-[92px]"
        aria-label="Open RINPO Phone — RINPO Runtime powered by RINADS Intelligence"
      >
        <span
          className="pointer-events-none absolute inset-x-2 bottom-0 h-5 rounded-[50%] bg-rinads-primary/35 blur-lg"
          aria-hidden
        />
        <Image
          src={RINPO_AVATAR}
          alt="RINPO"
          width={1024}
          height={1372}
          className="relative z-[1] h-full w-full object-contain object-bottom drop-shadow-[0_0_22px_rgba(159,75,199,0.58)] transition-transform duration-200 group-hover:-translate-y-1 group-focus-visible:-translate-y-1"
          priority={false}
        />
        <span
          className="absolute right-0 top-1 z-[2] grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-rinads-primary text-white shadow-[0_0_18px_rgba(159,75,199,0.72)]"
          aria-hidden
        >
          <MessageCircle size={14} />
        </span>
        <span
          className={`absolute bottom-1 right-1 z-[2] h-2.5 w-2.5 rounded-full ring-2 ring-black ${
            active ? "bg-amber-300" : "bg-emerald-400"
          }`}
          aria-hidden
        />
      </button>
      <span className="hidden max-w-[12rem] rounded-full border border-white/10 bg-black/75 px-3 py-1 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-white/85 shadow-lg backdrop-blur md:block">
        RINPO Phone · Runtime + Intelligence
      </span>
    </div>
  );
}
