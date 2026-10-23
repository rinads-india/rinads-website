export {
  colors,
  masterPalette,
  type RinadsColorToken,
  type RinadsMasterPaletteToken,
} from "./tokens";
export { typography } from "./typography";
export {
  semanticColors,
  statusColors,
  productStatusTokens,
  spacing,
  radii,
  shadows,
  motion,
  interaction,
  viewportChecks,
  type RinadsTheme,
  type RinadsStatusTone,
} from "./semantic";
export {
  brandRegistry,
  getBrandEntry,
  type RinadsBrandCategory,
  type RinadsBrandEntry,
  type RinadsBrandKey,
  type RinadsLifecycle,
} from "./registry";

export const brand = {
  name: "RINADS",
  company: "RINADS TECHNOLOGIES",
  intelligence: "RINADS INTELLIGENCE - RI",
  character: "RINPO",
  runtime: "RINPO RUNTIME",
  studios: "RINADS STUDIOS",
  tagline: "The AI Operating Platform for Business.",
} as const;
