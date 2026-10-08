import "server-only";

import {
  RinpoRuntimeStatusSource,
  SupabaseStatusSource,
} from "@/lib/founder-intelligence/adapters";
import type { ConnectionState } from "@/lib/founder-intelligence/types";
import type { RinpoControlSnapshot, RinpoMetric, RinpoMetricId } from "./types";

const REQUEST_TIMEOUT_MS = 5_000;

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
  const metrics =
    rawUrl && serviceRoleKey
      ? await Promise.all(
          PROBES.map((probe) => runProbe(rawUrl.replace(/\/$/, ""), serviceRoleKey, probe))
        )
      : disconnectedMetrics(
          "Live count unavailable until NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured server-side."
        );

  const dataPlane = summarizeDataPlane(metrics);

  return {
    checkedAt: now(),
    runtime,
    intelligenceBackend,
    metrics,
    dataPlaneState: dataPlane.state,
    dataPlaneDetail: dataPlane.detail,
  };
}
