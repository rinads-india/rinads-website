import type { LucideIcon } from "lucide-react";
import {
  LayoutGrid,
  MessageSquare,
  Zap,
  ShieldCheck,
  Briefcase,
  Users,
  Wallet,
  TrendingUp,
  Sun,
  Globe2,
  Settings2,
} from "lucide-react";
import type { PhoneScreenId } from "@/components/rinpo/RinpoPhoneScreens";

export type RinpoPhoneAudience = "public" | "authenticated" | "founder";
export type RinpoPhonePlacement = "dock" | "library";

export type RinpoPhoneMode = {
  id: PhoneScreenId;
  label: string;
  icon: LucideIcon;
  audience: RinpoPhoneAudience[];
  placement: RinpoPhonePlacement;
  /** When true, public users see a demo placeholder instead of live data */
  demoPlaceholder?: boolean;
};

/** Legacy screen ids map to canonical mode ids */
export const PHONE_SCREEN_ALIASES: Partial<Record<PhoneScreenId, PhoneScreenId>> = {
  chat: "ask",
  home: "apps",
  "quick-actions": "actions",
  notifications: "approvals",
  profile: "today",
};

export function normalizePhoneScreen(screen: PhoneScreenId): PhoneScreenId {
  return PHONE_SCREEN_ALIASES[screen] ?? screen;
}

/**
 * The dock stays intentionally small. Secondary business modules live in the
 * app library so adding an industry module does not turn the handset into a
 * horizontally scrolling navigation bar.
 */
export const RINPO_PHONE_MODES: RinpoPhoneMode[] = [
  { id: "today", label: "Today", icon: Sun, audience: ["public", "authenticated", "founder"], placement: "dock", demoPlaceholder: true },
  { id: "ask", label: "RINPO", icon: MessageSquare, audience: ["public", "authenticated", "founder"], placement: "dock" },
  { id: "work", label: "Work", icon: Briefcase, audience: ["authenticated", "founder"], placement: "dock", demoPlaceholder: true },
  { id: "world", label: "World", icon: Globe2, audience: ["public", "authenticated", "founder"], placement: "dock" },
  { id: "apps", label: "Apps", icon: LayoutGrid, audience: ["public", "authenticated", "founder"], placement: "dock" },

  { id: "actions", label: "Actions", icon: Zap, audience: ["public", "authenticated", "founder"], placement: "library" },
  { id: "approvals", label: "Approvals", icon: ShieldCheck, audience: ["authenticated", "founder"], placement: "library", demoPlaceholder: true },
  { id: "customers", label: "Customers", icon: Users, audience: ["authenticated", "founder"], placement: "library", demoPlaceholder: true },
  { id: "money", label: "Money", icon: Wallet, audience: ["authenticated", "founder"], placement: "library", demoPlaceholder: true },
  { id: "growth", label: "Growth", icon: TrendingUp, audience: ["public", "authenticated", "founder"], placement: "library", demoPlaceholder: true },
  { id: "settings", label: "Settings", icon: Settings2, audience: ["authenticated", "founder"], placement: "library" },
];

export function getPhoneModesForAudience(audience: RinpoPhoneAudience): RinpoPhoneMode[] {
  return RINPO_PHONE_MODES.filter((mode) => mode.audience.includes(audience));
}

export function getPhoneDockModesForAudience(audience: RinpoPhoneAudience): RinpoPhoneMode[] {
  return getPhoneModesForAudience(audience).filter((mode) => mode.placement === "dock");
}
