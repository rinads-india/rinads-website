export type VercelDomainConfig = {
  token: string;
  projectId: string;
  teamId?: string;
};

export function getVercelDomainConfigFromEnv(): VercelDomainConfig | null {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_STOREFRONT_PROJECT_ID;
  if (!token || !projectId) return null;
  return {
    token,
    projectId,
    teamId: process.env.VERCEL_TEAM_ID,
  };
}

export type VercelDomainResult =
  | { ok: true; domainId: string }
  | { ok: false; error: string };

/** Server-only Vercel Domains API client. Returns mock id when credentials absent. */
export async function addDomainToVercelProject(
  hostname: string,
  config?: VercelDomainConfig | null
): Promise<VercelDomainResult> {
  if (!config) {
    return { ok: true, domainId: `mock_${hostname.replace(/\./g, "_")}` };
  }

  const url = config.teamId
    ? `https://api.vercel.com/v10/projects/${config.projectId}/domains?teamId=${config.teamId}`
    : `https://api.vercel.com/v10/projects/${config.projectId}/domains`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: hostname }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: text || res.statusText };
    }
    const data = (await res.json()) as { uid?: string; name?: string };
    return { ok: true, domainId: data.uid ?? data.name ?? hostname };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Vercel API error" };
  }
}

export async function removeDomainFromVercelProject(
  hostname: string,
  config?: VercelDomainConfig | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!config) return { ok: true };
  const url = config.teamId
    ? `https://api.vercel.com/v9/projects/${config.projectId}/domains/${hostname}?teamId=${config.teamId}`
    : `https://api.vercel.com/v9/projects/${config.projectId}/domains/${hostname}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${config.token}` },
    });
    if (!res.ok) {
      return { ok: false, error: await res.text() };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Vercel API error" };
  }
}
