import "server-only";

import { createPlatformServiceClient } from "@/lib/supabase/server";
import type {
  ConnectionState,
  FounderIntelligenceSnapshot,
  FounderOperationalAlert,
  FounderWorkItem,
  FounderWorkspace,
  SourceCheck,
  SourceCheckItem,
  StatusSource,
  WorkspaceResult,
  WorkResult,
} from "./types";

const REQUEST_TIMEOUT_MS = 5_000;
const IST_OFFSET_MS = 330 * 60 * 1000;

function now() {
  return new Date().toISOString();
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function unavailable(id: string, label: string, error: unknown): SourceCheck {
  return {
    id,
    label,
    state: "unavailable",
    detail: error instanceof Error ? error.message : "The source did not respond.",
    checkedAt: now(),
  };
}

export class SupabaseStatusSource implements StatusSource {
  readonly id = "supabase";
  readonly label = "RINADS Intelligence backend";

  async check(): Promise<SourceCheck> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return {
        id: this.id,
        label: this.label,
        state: "not_connected",
        detail: "Supabase project URL or anon key is not configured.",
        checkedAt: null,
      };
    }

    try {
      const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };
      const [auth, database] = await Promise.all([
        fetchWithTimeout(`${url}/auth/v1/health`, { headers }),
        fetchWithTimeout(`${url}/rest/v1/`, { headers }),
      ]);
      const authOk = auth.ok;
      const databaseOk = database.ok;
      const projectRef = new URL(url).hostname.split(".")[0];

      return {
        id: this.id,
        label: this.label,
        state: authOk && databaseOk ? "operational" : "degraded",
        detail: `Auth ${authOk ? "reachable" : `HTTP ${auth.status}`}; database API ${
          databaseOk ? "reachable" : `HTTP ${database.status}`
        }.`,
        checkedAt: now(),
        href: projectRef ? `https://supabase.com/dashboard/project/${projectRef}` : undefined,
      };
    } catch (error) {
      return unavailable(this.id, this.label, error);
    }
  }
}

type VercelProject = { id?: string; name: string; envKey: string; href: string };

const VERCEL_PROJECTS: VercelProject[] = [
  {
    name: "www.rinads.com",
    envKey: "VERCEL_WEBSITE_PROJECT_ID",
    href: "https://www.rinads.com",
  },
  {
    name: "Platform admin",
    envKey: "VERCEL_PLATFORM_ADMIN_PROJECT_ID",
    href: "https://admin.rinads.com",
  },
  {
    name: "Owner portal",
    envKey: "VERCEL_OWNER_PORTAL_PROJECT_ID",
    href: "https://app.rinads.com",
  },
  {
    name: "Customer portal",
    envKey: "VERCEL_CUSTOMER_PORTAL_PROJECT_ID",
    href: "https://customers.rinads.com",
  },
  {
    name: "R GLOW",
    envKey: "VERCEL_RINAGLOW_PROJECT_ID",
    href: "https://glow.rinads.com",
  },
  {
    name: "Storefront",
    envKey: "VERCEL_STOREFRONT_PROJECT_ID",
    href: "https://store.rinads.com",
  },
];

type VercelDeployment = {
  id?: string;
  state?: string;
  readyState?: string;
  url?: string;
  created?: number;
  meta?: {
    githubCommitSha?: string;
    githubCommitRef?: string;
    githubCommitMessage?: string;
    githubRepo?: string;
    githubOrg?: string;
  };
};

type VercelDeploymentResponse = {
  deployments?: VercelDeployment[];
};

function vercelProjectState(deploymentState: string): ConnectionState {
  if (deploymentState === "READY") return "operational";
  if (deploymentState === "none") return "unavailable";
  return "degraded";
}

function deploymentDetail(deployment: VercelDeployment | undefined, state: string): string {
  if (!deployment) return "No production deployment was returned by Vercel.";
  const parts = [`Production ${state}.`];
  if (deployment.meta?.githubCommitRef) parts.push(`Branch ${deployment.meta.githubCommitRef}.`);
  if (deployment.meta?.githubCommitSha) parts.push(`Commit ${deployment.meta.githubCommitSha.slice(0, 7)}.`);
  if (deployment.created) {
    parts.push(
      `Created ${new Date(deployment.created).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}.`
    );
  }
  return parts.join(" ");
}

export class VercelStatusSource implements StatusSource {
  readonly id = "vercel";
  readonly label = "Frontend deployments";

  async check(): Promise<SourceCheck> {
    const token = process.env.FOUNDER_INTELLIGENCE_VERCEL_TOKEN;
    const teamId = process.env.VERCEL_TEAM_ID;
    const projects = VERCEL_PROJECTS.map((project) => ({
      ...project,
      id: process.env[project.envKey],
    })).filter((project) => project.id);

    if (!token || projects.length === 0) {
      return {
        id: this.id,
        label: this.label,
        state: "not_connected",
        detail:
          "Vercel read token and project IDs are required to read production deployments.",
        checkedAt: null,
      };
    }

    try {
      const items: SourceCheckItem[] = await Promise.all(
        projects.map(async (project) => {
          const query = new URLSearchParams({
            projectId: project.id!,
            target: "production",
            limit: "1",
          });
          if (teamId) query.set("teamId", teamId);
          const response = await fetchWithTimeout(
            `https://api.vercel.com/v6/deployments?${query.toString()}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!response.ok) {
            return {
              id: project.envKey,
              label: project.name,
              state: "degraded",
              detail: `Vercel returned HTTP ${response.status}.`,
              href: project.href,
            } satisfies SourceCheckItem;
          }

          const payload = (await response.json()) as VercelDeploymentResponse;
          const deployment = payload.deployments?.[0];
          const deploymentState = deployment?.readyState ?? deployment?.state ?? "none";
          return {
            id: project.envKey,
            label: project.name,
            state: vercelProjectState(deploymentState),
            detail: deploymentDetail(deployment, deploymentState),
            href: deployment?.url ? `https://${deployment.url}` : project.href,
            metadata: {
              deploymentState,
              deploymentId: deployment?.id ?? null,
              createdAt: deployment?.created ? new Date(deployment.created).toISOString() : null,
              commitSha: deployment?.meta?.githubCommitSha ?? null,
              commitRef: deployment?.meta?.githubCommitRef ?? null,
              commitMessage: deployment?.meta?.githubCommitMessage ?? null,
              githubRepo: deployment?.meta?.githubRepo ?? null,
              githubOrg: deployment?.meta?.githubOrg ?? null,
            },
          } satisfies SourceCheckItem;
        })
      );

      const ready = items.filter((item) => item.state === "operational").length;
      const exceptions = items.filter((item) => item.state !== "operational").map((item) => item.label);
      return {
        id: this.id,
        label: this.label,
        state: ready === items.length ? "operational" : "degraded",
        detail:
          exceptions.length === 0
            ? `${ready}/${items.length} configured production projects report READY.`
            : `${ready}/${items.length} configured production projects report READY. Attention: ${exceptions.join(", ")}.`,
        checkedAt: now(),
        href: "https://vercel.com/dashboard",
        items,
      };
    } catch (error) {
      return unavailable(this.id, this.label, error);
    }
  }
}

export class RinpoRuntimeStatusSource implements StatusSource {
  readonly id = "rinpo-runtime";
  readonly label = "RINPO runtime";

  async check(): Promise<SourceCheck> {
    const url = process.env.RINPO_RUNTIME_HEALTH_URL;
    if (!url) {
      return {
        id: this.id,
        label: this.label,
        state: "not_connected",
        detail: "The separate RINPO runtime has no configured health endpoint.",
        checkedAt: null,
        href:
          process.env.RINPO_RUNTIME_CONSOLE_URL ??
          "https://github.com/rinads-india/rinads-rinpo-AI-Native-Business-Communication-OS",
      };
    }

    try {
      const token = process.env.RINPO_RUNTIME_HEALTH_TOKEN;
      const response = await fetchWithTimeout(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return {
        id: this.id,
        label: this.label,
        state: response.ok ? "operational" : "degraded",
        detail: response.ok
          ? "Configured runtime health endpoint responded successfully."
          : `Runtime health endpoint returned HTTP ${response.status}.`,
        checkedAt: now(),
        href: process.env.RINPO_RUNTIME_CONSOLE_URL,
      };
    } catch (error) {
      return unavailable(this.id, this.label, error);
    }
  }
}

type WorkspaceRow = {
  id: unknown;
  organization_id: unknown;
  name: unknown;
  slug: unknown;
  kind: unknown;
  status: unknown;
  is_default: unknown;
  organizations?: { name?: unknown } | Array<{ name?: unknown }> | null;
  locations?: Array<{ count?: unknown }> | null;
};

export async function loadFounderWorkspaces(): Promise<WorkspaceResult> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return {
      state: "not_connected",
      workspaces: [],
      checkedAt: null,
      detail: "Supabase service credentials are not configured for the workspace registry.",
    };
  }

  try {
    const service = createPlatformServiceClient();
    const { data, error } = await (
      service as unknown as {
        from: (table: string) => {
          select: (columns: string) => {
            order: (
              column: string
            ) => Promise<{
              data: WorkspaceRow[] | null;
              error: { message: string } | null;
            }>;
          };
        };
      }
    )
      .from("workspaces")
      .select(
        "id, organization_id, name, slug, kind, status, is_default, organizations(name), locations(count)"
      )
      .order("name");

    if (error) {
      return {
        state: "degraded",
        workspaces: [],
        checkedAt: now(),
        detail: error.message,
      };
    }

    const workspaces: FounderWorkspace[] = (data ?? []).map((row) => {
      const organization = Array.isArray(row.organizations)
        ? row.organizations[0]
        : row.organizations;
      return {
        id: String(row.id),
        organizationId: String(row.organization_id),
        organizationName: String(organization?.name ?? "Unknown organization"),
        name: String(row.name),
        slug: String(row.slug),
        kind: String(row.kind),
        status: String(row.status),
        isDefault: Boolean(row.is_default),
        locationCount: Number(row.locations?.[0]?.count ?? 0),
      };
    });

    return { state: "operational", workspaces, checkedAt: now() };
  } catch (error) {
    return {
      state: "unavailable",
      workspaces: [],
      checkedAt: now(),
      detail: error instanceof Error ? error.message : "Workspace registry did not respond.",
    };
  }
}

type WorkTaskRow = {
  id: unknown;
  organization_id: unknown;
  title: unknown;
  status: unknown;
  priority: unknown;
  due_at: unknown;
  assignee_id: unknown;
  entity_type: unknown;
  entity_id: unknown;
  organizations?: { name?: unknown } | Array<{ name?: unknown }> | null;
};

type OperationalAlertRow = {
  id: unknown;
  organization_id: unknown;
  title: unknown;
  message: unknown;
  severity: unknown;
  created_at: unknown;
  organizations?: { name?: unknown } | Array<{ name?: unknown }> | null;
};

const emptyWorkCounts = {
  open: 0,
  blocked: 0,
  overdue: 0,
  dueToday: 0,
  urgent: 0,
  unacknowledgedAlerts: 0,
} as const;

function relationName(value: WorkTaskRow["organizations"] | OperationalAlertRow["organizations"]): string {
  const organization = Array.isArray(value) ? value[0] : value;
  return String(organization?.name ?? "Unknown organization");
}

function istDayBounds(reference = new Date()): { start: string; end: string } {
  const shifted = new Date(reference.getTime() + IST_OFFSET_MS);
  const startUtc =
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
      0,
      0,
      0,
      0
    ) - IST_OFFSET_MS;
  return {
    start: new Date(startUtc).toISOString(),
    end: new Date(startUtc + 24 * 60 * 60 * 1000).toISOString(),
  };
}

function countFromContentRange(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

async function restCount(
  baseUrl: string,
  serviceRoleKey: string,
  table: string,
  filters: Record<string, string>
): Promise<number> {
  const query = new URLSearchParams({ select: "id", ...filters });
  const response = await fetchWithTimeout(`${baseUrl}/rest/v1/${table}?${query.toString()}`, {
    method: "HEAD",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "count=exact",
    },
  });
  if (!response.ok) throw new Error(`${table} count returned HTTP ${response.status}.`);
  const count = countFromContentRange(response.headers.get("content-range"));
  if (count === null) throw new Error(`${table} did not return an exact count.`);
  return count;
}

async function restRows<T>(
  baseUrl: string,
  serviceRoleKey: string,
  table: string,
  query: URLSearchParams
): Promise<T[]> {
  const response = await fetchWithTimeout(`${baseUrl}/rest/v1/${table}?${query.toString()}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });
  if (!response.ok) throw new Error(`${table} returned HTTP ${response.status}.`);
  return (await response.json()) as T[];
}

export async function loadFounderWork(): Promise<WorkResult> {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !serviceRoleKey) {
    return {
      state: "not_connected",
      checkedAt: null,
      tasks: [],
      alerts: [],
      counts: emptyWorkCounts,
      detail: "Supabase service credentials are not configured for founder work intelligence.",
    };
  }

  const baseUrl = rawUrl.replace(/\/$/, "");
  const { start, end } = istDayBounds();
  const current = new Date().toISOString();
  const openStatus = "in.(todo,in_progress,blocked)";

  try {
    const taskQuery = new URLSearchParams({
      select:
        "id,organization_id,title,status,priority,due_at,assignee_id,entity_type,entity_id,organizations(name)",
      status: openStatus,
      order: "due_at.asc.nullslast,priority.desc,updated_at.desc",
      limit: "40",
    });
    const alertQuery = new URLSearchParams({
      select: "id,organization_id,title,message,severity,created_at,organizations(name)",
      acknowledged: "eq.false",
      order: "created_at.desc",
      limit: "20",
    });

    const [taskRows, alertRows, open, blocked, overdue, dueToday, urgent, unacknowledgedAlerts] =
      await Promise.all([
        restRows<WorkTaskRow>(baseUrl, serviceRoleKey, "operational_tasks", taskQuery),
        restRows<OperationalAlertRow>(baseUrl, serviceRoleKey, "operational_alerts", alertQuery),
        restCount(baseUrl, serviceRoleKey, "operational_tasks", { status: openStatus }),
        restCount(baseUrl, serviceRoleKey, "operational_tasks", { status: "eq.blocked" }),
        restCount(baseUrl, serviceRoleKey, "operational_tasks", {
          status: openStatus,
          due_at: `lt.${current}`,
        }),
        restCount(baseUrl, serviceRoleKey, "operational_tasks", {
          status: openStatus,
          due_at: `gte.${start}`,
          "due_at.lt": end,
        }),
        restCount(baseUrl, serviceRoleKey, "operational_tasks", {
          status: openStatus,
          priority: "eq.urgent",
        }),
        restCount(baseUrl, serviceRoleKey, "operational_alerts", {
          acknowledged: "eq.false",
        }),
      ]);

    const tasks: FounderWorkItem[] = taskRows.map((row) => ({
      id: String(row.id),
      organizationId: String(row.organization_id),
      organizationName: relationName(row.organizations),
      title: String(row.title),
      status: String(row.status) as FounderWorkItem["status"],
      priority: String(row.priority) as FounderWorkItem["priority"],
      dueAt: row.due_at ? String(row.due_at) : null,
      assigneeId: row.assignee_id ? String(row.assignee_id) : null,
      entityType: row.entity_type ? String(row.entity_type) : null,
      entityId: row.entity_id ? String(row.entity_id) : null,
    }));
    const alerts: FounderOperationalAlert[] = alertRows.map((row) => ({
      id: String(row.id),
      organizationId: String(row.organization_id),
      organizationName: relationName(row.organizations),
      title: String(row.title),
      message: String(row.message),
      severity: String(row.severity) as FounderOperationalAlert["severity"],
      createdAt: String(row.created_at),
    }));

    return {
      state: "operational",
      checkedAt: now(),
      tasks,
      alerts,
      counts: { open, blocked, overdue, dueToday, urgent, unacknowledgedAlerts },
    };
  } catch (error) {
    return {
      state: "degraded",
      checkedAt: now(),
      tasks: [],
      alerts: [],
      counts: emptyWorkCounts,
      detail: error instanceof Error ? error.message : "Founder work sources did not respond.",
    };
  }
}

export async function loadFounderIntelligenceSnapshot(): Promise<FounderIntelligenceSnapshot> {
  const sources: StatusSource[] = [
    new SupabaseStatusSource(),
    new VercelStatusSource(),
    new RinpoRuntimeStatusSource(),
  ];
  const [checks, workspaceResult, workResult] = await Promise.all([
    Promise.all(sources.map((source) => source.check())),
    loadFounderWorkspaces(),
    loadFounderWork(),
  ]);

  return { checkedAt: now(), sources: checks, workspaceResult, workResult };
}

export { VERCEL_PROJECTS };
