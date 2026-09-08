"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

type RINPOOrbProps = {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  priority?: boolean;
};

const SIZE_MAP = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
  xl: "h-28 w-28",
} as const;

export function RINPOOrb({ className, size = "md", priority = false }: RINPOOrbProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-rinads-primary/20 ring-1 ring-rinads-primary/40 shadow-[0_0_24px_rgba(159,75,199,0.35)]",
        SIZE_MAP[size],
        className,
      )}
    >
      <Image
        src="/assets/rinpo-head.png"
        alt="RINPO"
        fill
        sizes="112px"
        className="object-cover"
        priority={priority}
      />
    </div>
  );
}
