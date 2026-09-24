import { JsonLd } from "@/components/system/JsonLd";
import {
  buildBreadcrumbListJsonLd,
  buildOrganizationJsonLd,
  buildSoftwareApplicationJsonLd,
  buildWebPageJsonLd,
  buildWebSiteJsonLd,
  type JsonLdObject,
} from "@/lib/json-ld";
import { getRouteDefinition } from "@/lib/route-registry";

/**
 * Attach commercial JSON-LD for a registry path.
 * Uses route registry title/description when available.
 */
export function CommercialJsonLd({
  path,
  id,
  extra,
  includeOrganization = false,
  includeWebSite = false,
  includeSoftwareApplication = false,
  breadcrumbs,
}: {
  path: string;
  id?: string;
  extra?: JsonLdObject | JsonLdObject[];
  includeOrganization?: boolean;
  includeWebSite?: boolean;
  includeSoftwareApplication?: boolean;
  breadcrumbs?: Array<{ name: string; path: string }>;
}) {
  const route = getRouteDefinition(path);
  const title = route?.title ?? "RINADS";
  const description = route?.description ?? "";
  const nodes: JsonLdObject[] = [];

  if (includeOrganization) nodes.push(buildOrganizationJsonLd());
  if (includeWebSite) nodes.push(buildWebSiteJsonLd());
  nodes.push(buildWebPageJsonLd({ path, title, description }));
  if (includeSoftwareApplication) nodes.push(buildSoftwareApplicationJsonLd());
  if (breadcrumbs?.length) nodes.push(buildBreadcrumbListJsonLd(breadcrumbs));
  if (extra) {
    if (Array.isArray(extra)) nodes.push(...extra);
    else nodes.push(extra);
  }

  return <JsonLd id={id ?? `jsonld-${path.replace(/\W+/g, "-") || "home"}`} data={nodes} />;
}
