/**
 * Abuse guards for the public RINPO Live endpoint.
 *
 * Every session spends Runway credits, so an unauthenticated POST needs more
 * than the chat route's limiter: a same-origin check, a tight per-IP limit and
 * a daily ceiling. Limiters are in-memory (per serverless instance) — a
 * best-effort brake, not a billing guarantee. Set the limits in the Runway
 * Developer Portal as the hard cap.
 */

import { createRateLimiter } from "@/lib/chat-security";
import type { LiveConfig } from "./config";

export const LIVE_PER_IP_WINDOW_MS = 10 * 60_000;
export const LIVE_PER_IP_MAX = 3;
const DAY_MS = 24 * 60 * 60_000;

export type GuardInput = {
  ip: string;
  /** `Origin` request header (browsers always send it on cross-origin POST). */
  origin: string | null;
  /** `Host` request header. */
  host: string | null;
  /** Canonical public site URL. */
  siteUrl: string;
};

export type GuardResult =
  | { ok: true }
  | { ok: false; status: 403; error: string }
  | { ok: false; status: 429; error: string; retryAfterSec: number };

function hostVariants(siteUrl: string): string[] {
  try {
    const { host } = new URL(siteUrl);
    const bare = host.replace(/^www\./, "");
    return [host, bare, `www.${bare}`];
  } catch {
    return [];
  }
}

/** A missing Origin means a non-browser client — allowed; a foreign one is not. */
export function isAllowedOrigin(
  origin: string | null,
  host: string | null,
  siteUrl: string,
): boolean {
  if (!origin) return true;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  return originHost === host || hostVariants(siteUrl).includes(originHost);
}

export function createLiveGuards() {
  const perIp = createRateLimiter(LIVE_PER_IP_WINDOW_MS, LIVE_PER_IP_MAX);
  const dailyLimiters = new Map<number, ReturnType<typeof createRateLimiter>>();

  function daily(cap: number) {
    let limiter = dailyLimiters.get(cap);
    if (!limiter) {
      limiter = createRateLimiter(DAY_MS, cap);
      dailyLimiters.set(cap, limiter);
    }
    return limiter;
  }

  return {
    check(input: GuardInput, config: Pick<LiveConfig, "dailySessionCap">): GuardResult {
      if (!isAllowedOrigin(input.origin, input.host, input.siteUrl)) {
        return { ok: false, status: 403, error: "Forbidden origin" };
      }
      const ip = perIp.check(input.ip);
      if (!ip.allowed) {
        return {
          ok: false,
          status: 429,
          error: "Too many live sessions started from this network. Please try again shortly.",
          retryAfterSec: ip.retryAfterSec,
        };
      }
      const global = daily(config.dailySessionCap).check("global");
      if (!global.allowed) {
        return {
          ok: false,
          status: 429,
          error: "RINPO Live has reached today's session limit. Please try again tomorrow.",
          retryAfterSec: global.retryAfterSec,
        };
      }
      return { ok: true };
    },
    /** test helper */
    _reset() {
      perIp._reset();
      dailyLimiters.forEach((limiter) => limiter._reset());
      dailyLimiters.clear();
    },
  };
}
