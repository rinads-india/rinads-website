/**
 * RINADS canonical brand color tokens.
 * Do not redesign without Founder approval.
 */
export const colors = {
  primary: "#9F4BC7",
  white: "#FFFFFF",
  black: "#000000",
  /** Extended atmosphere background used by Public Experience (not a primary brand swatch). */
  background: "#0A0A0A",
  foreground: "#EDEDED",
  glow: "rgba(159, 75, 199, 0.4)",
  /** Extended circuit accent used in intro atmosphere. */
  circuit: "#5DD4FF",
} as const;

export type RinadsColorToken = keyof typeof colors;
