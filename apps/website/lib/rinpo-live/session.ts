/**
 * Creates a Runway Characters realtime session on the server.
 *
 * Flow (see Runway "Building your integration"): create → poll until READY →
 * consume the one-time credentials → hand them to the browser, which joins the
 * WebRTC room directly. The Runway API key never leaves the server.
 */

import RunwayML from "@runwayml/sdk";
import type { RealtimeSessionCreateParams } from "@runwayml/sdk/resources/realtime-sessions";
import { consumeSession, pollUntilReady } from "@runwayml/avatars-react/api";
import type { LiveConfig } from "./config";
import type { LiveLanguageCode } from "./languages";
import { buildPersonality, buildStartScript } from "./personality";
import { SUGGEST_LINK_TOOL } from "./tools";

export type LiveSessionResult = {
  sessionId: string;
  serverUrl: string;
  token: string;
  roomName: string;
  maxDurationSeconds: number;
  language: LiveLanguageCode;
};

export type LiveSessionDeps = {
  create(body: RealtimeSessionCreateParams): Promise<{ id: string }>;
  /** Best-effort cancel so an abandoned session stops billing. */
  cancel(sessionId: string): Promise<void>;
  waitUntilReady(sessionId: string): Promise<{ sessionId: string; sessionKey: string }>;
  consume(input: {
    sessionId: string;
    sessionKey: string;
  }): Promise<{ url: string; token: string; roomName: string }>;
};

export class LiveSessionError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "LiveSessionError";
  }
}

const READY_TIMEOUT_MS = 20_000;
const READY_POLL_INTERVAL_MS = 500;

export function createRunwayDeps(config: LiveConfig): LiveSessionDeps {
  const client = new RunwayML({ apiKey: config.apiSecret });
  const baseUrl = client.baseURL;
  return {
    create: (body) => client.realtimeSessions.create(body),
    cancel: async (sessionId) => {
      await client.realtimeSessions.delete(sessionId);
    },
    waitUntilReady: (sessionId) =>
      pollUntilReady({
        sessionId,
        apiKey: config.apiSecret,
        baseUrl,
        timeoutMs: READY_TIMEOUT_MS,
        intervalMs: READY_POLL_INTERVAL_MS,
      }),
    consume: ({ sessionId, sessionKey }) =>
      consumeSession({ sessionId, sessionKey, baseUrl }),
  };
}

export async function createLiveSession(
  config: LiveConfig,
  language: LiveLanguageCode,
  deps: LiveSessionDeps = createRunwayDeps(config),
): Promise<LiveSessionResult> {
  let sessionId: string | undefined;
  try {
    const created = await deps.create({
      model: "gwm1_avatars",
      avatar: { type: "custom", avatarId: config.avatarId },
      personality: buildPersonality(language),
      startScript: buildStartScript(language),
      maxDuration: config.maxDurationSeconds,
      tools: [SUGGEST_LINK_TOOL],
    });
    sessionId = created.id;

    const ready = await deps.waitUntilReady(sessionId);
    const credentials = await deps.consume(ready);

    return {
      sessionId,
      serverUrl: credentials.url,
      token: credentials.token,
      roomName: credentials.roomName,
      maxDurationSeconds: config.maxDurationSeconds,
      language,
    };
  } catch (error) {
    if (sessionId) {
      // Credentials are one-time: a half-started session can never be joined.
      await deps.cancel(sessionId).catch(() => undefined);
    }
    throw new LiveSessionError("Could not start the live session.", error);
  }
}
