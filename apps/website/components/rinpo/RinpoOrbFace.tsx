"use client";

import Image from "next/image";

type RinpoOrbFaceProps = {
  className?: string;
};

export function RinpoOrbFace({ className = "" }: RinpoOrbFaceProps) {
  return (
    <span
      data-rinpo-orb
      aria-hidden
      className={`rinpo-orb-face relative mx-[0.06em] inline-flex h-[22vmin] w-[22vmin] shrink-0 items-center justify-center overflow-hidden rounded-full bg-rinads-primary shadow-[0_0_60px_rgba(159,75,199,0.85)] sm:h-[26vmin] sm:w-[26vmin] md:h-[28vmin] md:w-[28vmin] lg:h-[30vmin] lg:w-[30vmin] ${className}`}
    >
      <Image
        src="/assets/rinpo-head.png"
        alt=""
        width={512}
        height={512}
        priority
        className="absolute inset-0 h-full w-full scale-[1.35] object-cover object-[center_18%]"
      />
      <span className="rinpo-orb-blink absolute inset-x-[18%] top-[34%] h-[14%] rounded-full bg-[#1a0a24]/90" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/20 ring-inset"
      />
    </span>
  );
}
