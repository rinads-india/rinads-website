/**
 * RINADS canonical brand color tokens.
 * Source: Founder-approved RINADS STUDIOS Master Identity v1.0.
 * Do not redesign without Founder approval.
 */
export const colors = {
  /** RINADS Purple — canonical primary. */
  primary: "#9F4BC7",
  rinadsPurple: "#9F4BC7",
  /** Electric accent from the locked master palette. */
  electric: "#A45CFF",
  /** Deep Violet from the locked master palette. */
  deepViolet: "#5A189A",
  /** Near Black from the locked master palette. */
  nearBlack: "#0B0B0F",
  white: "#FFFFFF",
  /** Absolute black retained for legacy/utility use; not the canonical Near Black swatch. */
  black: "#000000",
  /** Extended atmosphere background used by Public Experience (not a primary brand swatch). */
  background: "#0A0A0A",
  foreground: "#EDEDED",
  glow: "rgba(159, 75, 199, 0.4)",
  /** Extended circuit accent used in intro atmosphere; not part of the locked master palette. */
  circuit: "#5DD4FF",
} as const;

export const masterPalette = {
  rinadsPurple: colors.rinadsPurple,
  electric: colors.electric,
  deepViolet: colors.deepViolet,
  nearBlack: colors.nearBlack,
  white: colors.white,
} as const;

export type RinadsColorToken = keyof typeof colors;
export type RinadsMasterPaletteToken = keyof typeof masterPalette;
