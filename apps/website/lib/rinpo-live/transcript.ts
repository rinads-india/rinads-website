/**
 * Small pure helpers for the live call UI (kept out of the component so they
 * can be unit-tested without a browser or a Runway session).
 */

export type Speaker = "visitor" | "rinpo";

/**
 * Runway streams transcript deltas with ids shaped
 * `runway-transcription-<role>-<turn>`; LiveKit-native segments only carry a
 * participant identity. Prefer the explicit role, fall back to the identity.
 */
export function speakerOf(entry: { id: string; participantIdentity: string }): Speaker {
  if (entry.id.startsWith("runway-transcription-user-")) return "visitor";
  if (entry.id.startsWith("runway-transcription-assistant-")) return "rinpo";
  return /user|visitor|guest/i.test(entry.participantIdentity) ? "visitor" : "rinpo";
}

/** 125 → "2:05". Negative values clamp to "0:00". */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
