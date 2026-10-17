/**
 * Server-side configuration for RINPO Live.
 *
 * The feature is off until both secrets exist — the API and UI report
 * `enabled: false` rather than pretending a conversation is possible.
 * Nothing here is ever sent to the browser except the derived limits.
 */

export type LiveConfig = {
  /** Runway API key (server only). */
  apiSecret: string;
  /** ID of the custom Runway Character created by `runway:sync`. */
  avatarId: string;
  /** Hard cap sent to Runway as `maxDuration` (Runway's own limit is 300). */
  maxDurationSeconds: number;
  /** Best-effort ceiling on sessions started per UTC day, per server instance. */
  dailySessionCap: number;
};

export const DEFAULT_MAX_DURATION_SECONDS = 180;
export const MIN_MAX_DURATION_SECONDS = 30;
export const RUNWAY_MAX_DURATION_SECONDS = 300;
export const DEFAULT_DAILY_SESSION_CAP = 200;

function intFromEnv(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function readLiveConfig(
  env: Record<string, string | undefined> = process.env,
): LiveConfig | null {
  const apiSecret = env.RUNWAYML_API_SECRET?.trim();
  const avatarId = env.RUNWAY_AVATAR_ID?.trim();
  if (!apiSecret || !avatarId) return null;
  return {
    apiSecret,
    avatarId,
    maxDurationSeconds: intFromEnv(
      env.RINPO_LIVE_MAX_SECONDS,
      DEFAULT_MAX_DURATION_SECONDS,
      MIN_MAX_DURATION_SECONDS,
      RUNWAY_MAX_DURATION_SECONDS,
    ),
    dailySessionCap: intFromEnv(
      env.RINPO_LIVE_DAILY_CAP,
      DEFAULT_DAILY_SESSION_CAP,
      1,
      100_000,
    ),
  };
}
