"use client";

import { useMemo } from "react";
import { useRinpo, type RinpoState } from "./RinpoProvider";
import { RinpoCharacter } from "./RinpoCharacter";
import type { RinpoExperienceState } from "@/lib/rinpo-experience";

export type RinpoPresenceState =
  | "idle"
  | "available"
  | "thinking"
  | "speaking"
  | "attention"
  | "action-required"
  | "approval-required"
  | "success"
  | "warning"
  | "offline";

const PRESENCE_LABELS: Record<RinpoPresenceState, string> = {
  idle: "RINPO • Ready",
  available: "RINPO • Ready",
  thinking: "RINPO • Thinking",
  speaking: "RINPO • Speaking",
  attention: "RINPO • Needs attention",
  "action-required": "RINPO • Action required",
  "approval-required": "RINPO • Approval required",
  success: "RINPO • Done",
  warning: "RINPO • Check status",
  offline: "RINPO • Offline",
};

function mapInteractionToPresence(
  interaction: RinpoExperienceState,
  rinpoState: RinpoState,
): RinpoPresenceState {
  if (rinpoState === "listening") return "attention";
  if (rinpoState === "speaking") return "speaking";
  if (rinpoState === "phone-out") return "available";
  switch (interaction) {
    case "thinking":
    case "executing":
      return "thinking";
    case "responding":
      return "speaking";
    case "awaiting-approval":
      return "approval-required";
    case "action-preview":
      return "action-required";
    case "success":
    case "audited":
      return "success";
    case "failure":
      return "warning";
    case "listening":
      return "attention";
    case "recommending":
      return "attention";
    case "open":
      return "available";
    case "closed":
    default:
      return rinpoState === "idle" ? "idle" : "available";
  }
}

/**
 * Product presence layer around the marketing RINPO character.
 * Click opens the RINADS phone (handled inside RinpoCharacter).
 */
export function RinpoPresence() {
  const { interactionState, rinpoState } = useRinpo();

  const presence = useMemo(
    () => mapInteractionToPresence(interactionState, rinpoState),
    [interactionState, rinpoState],
  );

  const label = PRESENCE_LABELS[presence] ?? "RINPO • Ready";

  return (
    <div data-rinpo-presence={presence} data-rinpo-label={label} aria-live="polite">
      <RinpoCharacter presenceLabel={label} />
    </div>
  );
}
