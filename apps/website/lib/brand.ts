import { brand, colors } from "@rinads/brand";

/** Proves workspace package wiring without changing visual design. */
export const siteBrand = {
  name: brand.name,
  tagline: brand.tagline,
  primary: colors.primary,
  background: colors.background,
} as const;
