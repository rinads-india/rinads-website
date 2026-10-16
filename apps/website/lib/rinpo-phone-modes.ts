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
} from "lucide-react";
import type { PhoneScreenId } from "@/components/rinpo/RinpoPhoneScreens";

export type RinpoPhoneAudience = "public" | "authenticated" | "founder";

export type RinpoPhoneMode = {
  id: PhoneScreenId;
  label: string;
  icon: LucideIcon;
  audience: RinpoPhoneAudience[];
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

export const RINPO_PHONE_MODES: RinpoPhoneMode[] = [
  { id: "today", label: "Today", icon: Sun, audience: ["public", "authenticated", "founder"], demoPlaceholder: true },
  { id: "ask", label: "Ask", icon: MessageSquare, audience: ["public", "authenticated", "founder"] },
  { id: "actions", label: "Actions", icon: Zap, audience: ["public", "authenticated", "founder"] },
  { id: "approvals", label: "Approvals", icon: ShieldCheck, audience: ["authenticated", "founder"], demoPlaceholder: true },
  { id: "work", label: "Work", icon: Briefcase, audience: ["authenticated", "founder"], demoPlaceholder: true },
  { id: "customers", label: "Customers", icon: Users, audience: ["authenticated", "founder"], demoPlaceholder: true },
  { id: "money", label: "Money", icon: Wallet, audience: ["authenticated", "founder"], demoPlaceholder: true },
  { id: "growth", label: "Growth", icon: TrendingUp, audience: ["public", "authenticated", "founder"], demoPlaceholder: true },
  { id: "apps", label: "Apps", icon: LayoutGrid, audience: ["public", "authenticated", "founder"] },
];

export function getPhoneModesForAudience(audience: RinpoPhoneAudience): RinpoPhoneMode[] {
  return RINPO_PHONE_MODES.filter((mode) => mode.audience.includes(audience));
}
