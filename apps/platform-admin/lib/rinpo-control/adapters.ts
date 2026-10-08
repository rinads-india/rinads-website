import "server-only";

import {
  RinpoRuntimeStatusSource,
  SupabaseStatusSource,
} from "@/lib/founder-intelligence/adapters";
import type { ConnectionState } from "@/lib/founder-intelligence/types";
import type {
  RinpoControlSnapshot,
  RinpoMetric,
  RinpoMetricId,
  RinpoSessionInspection,
  RinpoSessionSummary,
} from "./types";

const REQUEST_TIMEOUT_MS = 5_000;
const SESSION_INSPECTION_LIMIT = 12;

type Probe = {
  id: RinpoMetricId;
  label: string;
  table: string;
  detail: string;
  filter?: { column: string; value: string };
};

const PROBES: Probe[] = [
  {
    id: "conversations",
    label: "Conversations",
    table: "rinpo_conversations",
    detail: "Persisted RINPO conversation records.",
  },
  {
    id: "memory",
    label: "Memory facts",
    table: "rinpo_memory_facts",
    detail: "Tenant-scoped operational memory facts.",
  },
  {
    id: "pending_actions",
    label: "Pending actions",
    table: "rinpo_actions",
    detail: "RINPO actions still waiting in the governed action lifecycle.",
    filter: { column: "status", value: "pending" },
  },
  {
    id: "pending_approvals",
    label: "Pending approvals",
    table: "runtime_approvals",
    detail: "Runtime approvals requiring a human decision.",
    filter: { column: "status", value: "pending" },
  },
  {
    id: "audit_events",
    label: "Audit events",
    table: "rinpo_audit_log",
    detail: "Consequential RINPO/system actions recorded for audit.",
  },
  {
    id: "training_jobs",
    label: "Training jobs",
    table: "rinpo_training_jobs",
    detail: "RINPO training/evaluation pipeline jobs registered in the system of record.",
  },
];

function now() {
  return new Date().toISOString();
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function countFromContentRange(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function disconnectedMetrics(detail: string): RinpoMetric[] {
  return PROBES.map((probe) => ({
    id: probe.id,
    label: probe.label,
    value: null,
    state: "not_connected",
    detail,
  }));
}

function disconnectedSessionInspection(detail: string): RinpoSessionInspection {
  return {
    state: "not_connected",
    detail,
    sessions: [],
  };
}

async function runProbe(baseUrl: string, serviceRoleKey: string, probe: Probe): Promise<RinpoMetric> {
  const query = new URLSearchParams({ select: "id" });
  if (probe.filter) query.set(probe.filter.column, `eq.${probe.filter.value}`);

  try {
    const response = await fetchWithTimeout(
      `${baseUrl}/rest/v1/${encodeURIComponent(probe.table)}?${query.toString()}`,
      {
        method: "HEAD",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Prefer: "count=exact",
        },
      }
    );

    if (!response.ok) {
      return {
        id: probe.id,
        label: probe.label,
        value: null,
        state: "degraded",
        detail: `${probe.detail} Source returned HTTP ${response.status}.`,
      };
    }

    const count = countFromContentRange(response.headers.get("content-range"));
    return {
      id: probe.id,
      label: probe.label,
      value: count,
      state: count === null ? "degraded" : "operational",
      detail:
        count === null
          ? `${probe.detail} Source is reachable, but an exact count was not returned.`
          : probe.detail,
    };
  } catch (error) {
    return {
      id: probe.id,
      label: probe.label,
      value: null,
      state: "unavailable",
      detail: `${probe.detail} ${error instanceof Error ? error.message : "Source did not respond."}`,
    };
  }
}

function asSessionSummary(row: unknown): RinpoSessionSummary | null {
  if (!row || typeof row !== "object") return null;
  const value = row as Record<string, unknown>;
  const id = value.id;
  const organizationId = value.organization_id;
  const userId = value.user_id;
  const createdAt = value.created_at;
  const updatedAt = value.updated_at;

  if (
    typeof id !== "string" ||
    typeof organizationId !== "string" ||
    typeof userId !== "string" ||
    typeof createdAt !== "string" ||
    typeof updatedAt !== "string"
  ) {
    return null;
  }

  return { id, organizationId, userId, createdAt, updatedAt };
}

async function loadRecentSessions(
  baseUrl: string,
  serviceRoleKey: string
): Promise<RinpoSessionInspection> {
  const query = new URLSearchParams({
    select: "id,organization_id,user_id,created_at,updated_at",
    order: "updated_at.desc",
    limit: String(SESSION_INSPECTION_LIMIT),
  });

  try {
    const response = await fetchWithTimeout(
      `${baseUrl}/rest/v1/rinpo_conversations?${query.toString()}`,
      {
        method: "GET",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return {
        state: "degraded",
        detail: `Session metadata source returned HTTP ${response.status}. Transcript content was not requested.`,
        sessions: [],
      };
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return {
        state: "degraded",
        detail: "Session metadata source returned an unexpected response. Transcript content was not requested.",
        sessions: [],
      };
    }

    const sessions = payload
      .map(asSessionSummary)
      .filter((session): session is RinpoSessionSummary => session !== null);
    const skipped = payload.length - sessions.length;

    return {
      state: skipped > 0 ? "degraded" : "operational",
      detail:
        skipped > 0
          ? `${sessions.length} recent sessions loaded; ${skipped} malformed rows were excluded. Transcript and context content remain private.`
          : `${sessions.length} recent sessions loaded. Transcript and context content remain private and were not retrieved.`,
      sessions,
    };
  } catch (error) {
    return {
      state: "unavailable",
      detail: `Session metadata unavailable. Transcript content was not requested. ${
        error instanceof Error ? error.message : "Source did not respond."
      }`,
      sessions: [],
    };
  }
}

function summarizeDataPlane(metrics: RinpoMetric[]): {
  state: ConnectionState;
  detail: string;
} {
  if (metrics.every((metric) => metric.state === "not_connected")) {
    return {
      state: "not_connected",
      detail: "RINPO control data requires server-side Supabase service credentials.",
    };
  }
  if (metrics.every((metric) => metric.state === "operational")) {
    return {
      state: "operational",
      detail: "All canonical RINPO control tables responded with exact live counts.",
    };
  }
  if (metrics.some((metric) => metric.state === "operational")) {
    return {
      state: "degraded",
      detail: "Some RINPO control sources are live while others are unavailable or incomplete.",
    };
  }
  return {
    state: "unavailable",
    detail: "Configured RINPO control data sources did not return usable data.",
  };
}

export async function loadRinpoControlSnapshot(): Promise<RinpoControlSnapshot> {
  const [runtime, intelligenceBackend] = await Promise.all([
    new RinpoRuntimeStatusSource().check(),
    new SupabaseStatusSource().check(),
  ]);

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  let metrics: RinpoMetric[];
  let sessionInspection: RinpoSessionInspection;

  if (rawUrl && serviceRoleKey) {
    const baseUrl = rawUrl.replace(/\/$/, "");
    [metrics, sessionInspection] = await Promise.all([
      Promise.all(PROBES.map((probe) => runProbe(baseUrl, serviceRoleKey, probe))),
      loadRecentSessions(baseUrl, serviceRoleKey),
    ]);
  } else {
    const detail =
      "Live data unavailable until NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured server-side.";
    metrics = disconnectedMetrics(detail);
    sessionInspection = disconnectedSessionInspection(
      `${detail} Transcript and context content are never fetched by session inspection.`
    );
  }

  const dataPlane = summarizeDataPlane(metrics);

  return {
    checkedAt: now(),
    runtime,
    intelligenceBackend,
    metrics,
    dataPlaneState: dataPlane.state,
    dataPlaneDetail: dataPlane.detail,
    sessionInspection,
  };
}
