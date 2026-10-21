// RI World Bridge v1 — canonical contract between RINADS WORLD (Unity WebGL) and www.rinads.com

export const WORLD_BRIDGE_VERSION = "1.0.0" as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export type WorldPlace = {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** Unique name used in the Unity scene to teleport the user */
  scene_anchor: string;
  /** Whether the place is publicly accessible without authentication */
  public: boolean;
};

export type WorldEntity = {
  /** RI Entity projection id */
  entity_id: string;
  entity_type: "brand" | "product" | "service" | "partner";
  display_name: string;
  /** Unity prefab key to spawn */
  prefab_key: string;
  /** Scene the entity appears in */
  scene_anchor: string;
  /** Deep-link within www.rinads.com */
  web_href: string;
};

export type WorldSession = {
  session_token: string;
  user_id: string | null;
  org_id: string | null;
  role: string | null;
  /** Unix timestamp — session valid until */
  expires_at: number;
  /** Starting scene anchor */
  entry_anchor: string;
};

export type WorldBootstrapPayload = {
  version: typeof WORLD_BRIDGE_VERSION;
  /** Canonical URL of the Unity WebGL build */
  world_url: string;
  /** All publicly accessible places */
  places: WorldPlace[];
  /** Entities visible to this session (empty if unauthenticated) */
  entities: WorldEntity[];
  /** Present only when the user is authenticated */
  session: WorldSession | null;
  /** ISO 8601 timestamp of this bootstrap response */
  generated_at: string;
  /** Whether RINADS WORLD is live (false = Coming Soon) */
  live: boolean;
};

export type WorldEventType =
  | "world.entered"
  | "world.place.visited"
  | "world.entity.interacted"
  | "world.session.ended";

export type WorldEvent = {
  event: WorldEventType;
  session_token: string;
  payload: Record<string, unknown>;
  client_ts: number;
};

// ── Guards ────────────────────────────────────────────────────────────────────

export function isWorldBootstrapPayload(v: unknown): v is WorldBootstrapPayload {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return (
    p.version === WORLD_BRIDGE_VERSION &&
    typeof p.world_url === "string" &&
    Array.isArray(p.places) &&
    Array.isArray(p.entities) &&
    typeof p.generated_at === "string"
  );
}
