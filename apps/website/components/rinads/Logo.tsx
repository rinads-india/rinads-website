import Image from "next/image";

const LOGO_SRC = "/assets/rinads-logo.png";
const LOGO_W = 270;
const LOGO_H = 89;

/**
 * Official Rinads lockup, extracted from the brand kit sheet.
 * Size it with height utilities (the width tracks the artwork's ratio).
 */
export function Logo({
  className = "h-7 md:h-8",
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Rinads — Business simplified"
      width={LOGO_W}
      height={LOGO_H}
      priority={priority}
      className={`w-auto select-none ${className}`}
    />
  );
}
