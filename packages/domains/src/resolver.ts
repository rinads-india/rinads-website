export type DomainResolverClient = {
  from: (table: string) => {
    select: (cols?: string) => {
      eq: (
        col: string,
        val: string
      ) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> & {
        single?: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
  };
};

export type ResolvedStorefrontTenant = {
  organizationId: string;
  storefrontSlug: string;
  source: "slug_subdomain" | "custom_domain";
  hostname: string;
};

export async function resolveOrganizationByCustomDomain(
  client: DomainResolverClient,
  hostname: string
): Promise<ResolvedStorefrontTenant | null> {
  const normalized = hostname.toLowerCase().split(":")[0]!;
  const { data } = await client
    .from("organization_domains")
    .select("organization_id, hostname, status")
    .eq("hostname", normalized);

  const row = data?.find((r) => r.status === "active" || r.status === "verified");
  if (!row) return null;

  const orgId = String(row.organization_id);
  const { data: settings } = await client
    .from("organization_settings")
    .select("storefront_slug")
    .eq("organization_id", orgId);

  const slug = settings?.[0]?.storefront_slug ? String(settings[0].storefront_slug) : normalized.split(".")[0]!;

  return {
    organizationId: orgId,
    storefrontSlug: slug,
    source: "custom_domain",
    hostname: normalized,
  };
}

export async function resolveOrganizationByStorefrontSlug(
  client: DomainResolverClient,
  slug: string
): Promise<ResolvedStorefrontTenant | null> {
  const { data } = await client
    .from("organization_settings")
    .select("organization_id, storefront_slug")
    .eq("storefront_slug", slug.toLowerCase());

  const row = data?.[0];
  if (!row) return null;

  return {
    organizationId: String(row.organization_id),
    storefrontSlug: String(row.storefront_slug),
    source: "slug_subdomain",
    hostname: `${slug}.store.rinads.com`,
  };
}

export async function resolveStorefrontTenantFromHost(
  client: DomainResolverClient,
  host: string,
  platformDomain = "store.rinads.com"
): Promise<ResolvedStorefrontTenant | null> {
  const normalized = host.toLowerCase().split(":")[0]!;
  const slug = normalized.endsWith(`.${platformDomain}`)
    ? normalized.slice(0, -(platformDomain.length + 1))
    : null;

  if (slug && !slug.includes(".")) {
    return resolveOrganizationByStorefrontSlug(client, slug);
  }

  return resolveOrganizationByCustomDomain(client, normalized);
}
