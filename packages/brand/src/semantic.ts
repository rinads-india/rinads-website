/**
 * RINADS UX v2 semantic design foundations.
 *
 * These tokens are additive to the locked brand primitives in tokens.ts.
 * Product UI should consume semantic intent (surface, text, status, motion)
 * instead of inventing page-local values.
 */

export const semanticColors = {
  light: {
    background: "#F4F5F8",
    foreground: "#111827",
    surface: "#FFFFFF",
    surfaceRaised: "#FFFFFF",
    surfaceMuted: "#EEF0F4",
    textPrimary: "#111827",
    textSecondary: "#4B5563",
    textMuted: "#6B7280",
    border: "#E5E7EB",
    borderStrong: "#D1D5DB",
    interactive: "#9F4BC7",
    interactiveHover: "#7A35A0",
    focus: "#9F4BC7",
  },
  dark: {
    background: "#000000",
    foreground: "#FFFFFF",
    surface: "#0A0A0A",
    surfaceRaised: "#14101C",
    surfaceMuted: "#1A1224",
    textPrimary: "#FFFFFF",
    textSecondary: "#D1D5DB",
    textMuted: "#94A3B8",
    border: "rgba(255, 255, 255, 0.12)",
    borderStrong: "rgba(255, 255, 255, 0.20)",
    interactive: "#9F4BC7",
    interactiveHover: "#C06BE8",
    focus: "#C06BE8",
  },
} as const;

export const statusColors = {
  success: {
    foreground: "#166534",
    background: "#DCFCE7",
    foregroundDark: "#BBF7D0",
    backgroundDark: "rgba(22, 101, 52, 0.28)",
  },
  warning: {
    foreground: "#92400E",
    background: "#FEF3C7",
    foregroundDark: "#FDE68A",
    backgroundDark: "rgba(146, 64, 14, 0.28)",
  },
  critical: {
    foreground: "#991B1B",
    background: "#FEE2E2",
    foregroundDark: "#FECACA",
    backgroundDark: "rgba(153, 27, 27, 0.28)",
  },
  info: {
    foreground: "#1E40AF",
    background: "#DBEAFE",
    foregroundDark: "#BFDBFE",
    backgroundDark: "rgba(30, 64, 175, 0.28)",
  },
} as const;

export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  32: "8rem",
} as const;

export const radii = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  "2xl": "2rem",
  pill: "9999px",
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.08)",
  md: "0 8px 24px rgba(0, 0, 0, 0.12)",
  lg: "0 18px 48px rgba(0, 0, 0, 0.18)",
  intelligence: "0 16px 48px rgba(159, 75, 199, 0.22)",
} as const;

export const motion = {
  duration: {
    instant: 80,
    fast: 140,
    normal: 220,
    deliberate: 320,
    slow: 480,
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    emphasized: "cubic-bezier(0.16, 1, 0.3, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
  },
} as const;

export const interaction = {
  minTouchTarget: "44px",
  focusRingWidth: "2px",
  focusRingOffset: "2px",
} as const;

export const viewportChecks = {
  mobileSmall: 320,
  mobile: 390,
  mobileLarge: 430,
  tablet: 768,
  laptop: 1024,
  desktop: 1440,
  desktopWide: 1728,
  desktopFullHd: 1920,
} as const;

export type RinadsTheme = keyof typeof semanticColors;
export type RinadsStatusTone = keyof typeof statusColors;
