import "server-only";

import { createPlatformServiceClient } from "@/lib/supabase/server";
import type {
  FounderIntelligenceSnapshot,
  FounderWorkspace,
  SourceCheck,
  StatusSource,
  WorkspaceResult,
} from "./types";

const REQUEST_TIMEOUT_MS = 5_000;

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

type VercelDeploymentResponse = {
  deployments?: Array<{ state?: string; readyState?: string; url?: string; created?: number }>;
};

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
      const results = await Promise.all(
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
          if (!response.ok) return { name: project.name, state: `HTTP ${response.status}` };
          const payload = (await response.json()) as VercelDeploymentResponse;
          const deployment = payload.deployments?.[0];
          return {
            name: project.name,
            state: deployment?.readyState ?? deployment?.state ?? "none",
          };
        })
      );

      const ready = results.filter((result) => result.state === "READY").length;
      return {
        id: this.id,
        label: this.label,
        state: ready === results.length ? "operational" : "degraded",
        detail: `${ready}/${results.length} configured production projects report READY.`,
        checkedAt: now(),
        href: "https://vercel.com/dashboard",
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

export async function loadFounderIntelligenceSnapshot(): Promise<FounderIntelligenceSnapshot> {
  const sources: StatusSource[] = [
    new SupabaseStatusSource(),
    new VercelStatusSource(),
    new RinpoRuntimeStatusSource(),
  ];
  const [checks, workspaceResult] = await Promise.all([
    Promise.all(sources.map((source) => source.check())),
    loadFounderWorkspaces(),
  ]);

  return { checkedAt: now(), sources: checks, workspaceResult };
}

export { VERCEL_PROJECTS };
