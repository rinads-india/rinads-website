"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";

type RINPOAvatarProps = {
  className?: string;
  variant?: "head" | "avatar" | "full";
  alt?: string;
};

const SRC = {
  head: "/assets/rinpo-head.png",
  avatar: "/assets/rinpo-avatar.png",
  full: "/assets/rinpo-full-body.png",
} as const;

export function RINPOAvatar({
  className,
  variant = "avatar",
  alt = "RINPO — RINADS Intelligent Navigation & Process Oracle",
}: RINPOAvatarProps) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image src={SRC[variant]} alt={alt} fill sizes="320px" className="object-contain" />
    </div>
  );
}
