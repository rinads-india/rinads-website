import { isNonEmptyString } from "@rinads/shared";

export const CHAT_MAX_MESSAGE_LENGTH = 2000;
export const CHAT_RATE_LIMIT_WINDOW_MS = 60_000;
export const CHAT_RATE_LIMIT_MAX = 30;

export type ChatRequestBody = {
  message: string;
  lang?: "en" | "ml";
  context?: {
    surface?: "os" | "phone";
    module?: string;
    orgId?: string;
  };
};

export type ChatValidationError = {
  status: 400 | 429;
  error: string;
};

export function validateChatBody(input: unknown): ChatRequestBody | ChatValidationError {
  if (input === null || typeof input !== "object") {
    return { status: 400, error: "Invalid request" };
  }
  const body = input as Record<string, unknown>;
  if (!isNonEmptyString(body.message)) {
    return { status: 400, error: "Message is required" };
  }
  const message = body.message.trim();
  if (!message) {
    return { status: 400, error: "Message is required" };
  }
  if (message.length > CHAT_MAX_MESSAGE_LENGTH) {
    return {
      status: 400,
      error: `Message must be at most ${CHAT_MAX_MESSAGE_LENGTH} characters`,
    };
  }
  const lang = body.lang === "ml" ? "ml" : body.lang === "en" || body.lang === undefined ? "en" : null;
  if (lang === null) {
    return { status: 400, error: "Invalid language" };
  }
  const context =
    body.context && typeof body.context === "object"
      ? (body.context as ChatRequestBody["context"])
      : undefined;
  return { message, lang, context };
}

/**
 * Best-effort in-memory rate limiter.
 * Caveat: ineffective across multiple serverless instances — Phase 1+ should use edge/Upstash.
 */
export function createRateLimiter(windowMs: number, max: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key: string): { allowed: true } | { allowed: false; retryAfterSec: number } {
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || now >= entry.resetAt) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true };
      }
      if (entry.count >= max) {
        return {
          allowed: false,
          retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
        };
      }
      entry.count += 1;
      return { allowed: true };
    },
    /** test helper */
    _reset() {
      hits.clear();
    },
  };
}

export const chatRateLimiter = createRateLimiter(
  CHAT_RATE_LIMIT_WINDOW_MS,
  CHAT_RATE_LIMIT_MAX
);
