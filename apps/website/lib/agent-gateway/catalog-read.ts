import type { RinadsAgentPrincipal } from "./principal";
import { createRinadsAgentDataClient } from "./data-client";

export const AGENT_CATALOG_READ_FLAG = "agent.commerce.catalog.read" as const;
export const AGENT_CATALOG_READ_PERMISSION = "commerce.catalog.read" as const;

export type RinadsCatalogReadResult =
  | { ok: true; data: Record<string, unknown> }
  | {
      ok: false;
      status: "invalid" | "forbidden" | "disabled" | "unavailable";
      reason: string;
    };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function parseInput(value: unknown):
  | { ok: true; query?: string; limit: number }
  | { ok: false; reason: string } {
  if (value === undefined || value === null) return { ok: true, limit: 25 };
  const input = asRecord(value);
  if (!input) return { ok: false, reason: "Catalog input must be an object." };

  const query = input.query === undefined ? undefined : text(input.query);
  if (input.query !== undefined && !query) {
    return { ok: false, reason: "query must be a non-empty string when supplied." };
  }
  if (query && query.length > 200) {
    return { ok: false, reason: "query must not exceed 200 characters." };
  }

  const rawLimit = input.limit === undefined ? 25 : numberValue(input.limit);
  if (!rawLimit || !Number.isSafeInteger(rawLimit) || rawLimit < 1 || rawLimit > 50) {
    return { ok: false, reason: "limit must be an integer between 1 and 50." };
  }

  return { ok: true, query, limit: rawLimit };
}

function rowEnabledForActor(
  rows: readonly Record<string, unknown>[],
  actorId: string
): boolean {
  const userOverride = rows.find((row) => text(row.user_id) === actorId);
  if (userOverride) return userOverride.enabled === true;

  const organizationOverride = rows.find((row) => !text(row.user_id));
  return organizationOverride?.enabled === true;
}

/**
 * Execute the first externally callable RINADS READ capability.
 *
 * The capability is intentionally fail-closed behind all of:
 * - authenticated Agent Principal;
 * - server-resolved organization scope;
 * - canonical `commerce.catalog.read` permission;
 * - explicit tenant/user feature-flag opt in;
 * - the caller's normal Supabase RLS context;
 * - explicit organization filters on every data query.
 */
export async function executeRinadsCatalogRead(input: {
  request: Request;
  principal: RinadsAgentPrincipal;
  arguments?: unknown;
}): Promise<RinadsCatalogReadResult> {
  const parsed = parseInput(input.arguments);
  if (!parsed.ok) return { ok: false, status: "invalid", reason: parsed.reason };

  if (!input.principal.permissionIds.includes(AGENT_CATALOG_READ_PERMISSION)) {
    return {
      ok: false,
      status: "forbidden",
      reason: `Missing required permission: ${AGENT_CATALOG_READ_PERMISSION}.`,
    };
  }

  const client = await createRinadsAgentDataClient(input.request);
  if (!client) {
    return {
      ok: false,
      status: "unavailable",
      reason: "A valid RLS-scoped data client could not be established.",
    };
  }

  const { data: flagRows, error: flagError } = await client
    .from("feature_flag_overrides")
    .select("enabled,user_id")
    .eq("organization_id", input.principal.organizationId)
    .eq("flag_key", AGENT_CATALOG_READ_FLAG);

  if (flagError) {
    return {
      ok: false,
      status: "unavailable",
      reason: "Catalog capability entitlement could not be verified.",
    };
  }

  const normalizedFlagRows = (flagRows ?? []).map((row) => row as Record<string, unknown>);
  if (!rowEnabledForActor(normalizedFlagRows, input.principal.actorId)) {
    return {
      ok: false,
      status: "disabled",
      reason: `Capability requires explicit ${AGENT_CATALOG_READ_FLAG}=true entitlement.`,
    };
  }

  let productsQuery = client
    .from("products")
    .select("id,name,slug,description,status,category_slug,tags,rating_avg,rating_count")
    .eq("organization_id", input.principal.organizationId)
    .eq("status", "published")
    .limit(parsed.limit);

  if (parsed.query) {
    const escaped = parsed.query.replace(/[\\%_]/g, (character) => `\\${character}`);
    productsQuery = productsQuery.ilike("name", `%${escaped}%`);
  }

  const { data: productRows, error: productError } = await productsQuery;
  if (productError) {
    return {
      ok: false,
      status: "unavailable",
      reason: "Tenant-scoped catalog products could not be read.",
    };
  }

  const products = (productRows ?? []).map((row) => row as Record<string, unknown>);
  const productIds = products.map((row) => text(row.id)).filter((id): id is string => Boolean(id));

  let variants: Record<string, unknown>[] = [];
  if (productIds.length > 0) {
    const { data: variantRows, error: variantError } = await client
      .from("product_variants")
      .select("id,product_id,name,sku,price,compare_at_price,stock,weight_grams,status")
      .eq("organization_id", input.principal.organizationId)
      .eq("status", "active")
      .in("product_id", productIds);

    if (variantError) {
      return {
        ok: false,
        status: "unavailable",
        reason: "Tenant-scoped catalog variants could not be read.",
      };
    }
    variants = (variantRows ?? []).map((row) => row as Record<string, unknown>);
  }

  return {
    ok: true,
    data: {
      capability: "commerce.catalog.read",
      organizationId: input.principal.organizationId,
      query: parsed.query ?? null,
      count: products.length,
      products: products.map((product) => {
        const productId = text(product.id) ?? "";
        return {
          id: productId,
          name: text(product.name) ?? "",
          slug: text(product.slug) ?? "",
          description: text(product.description) ?? null,
          status: text(product.status) ?? "published",
          category: text(product.category_slug) ?? null,
          tags: Array.isArray(product.tags)
            ? product.tags.filter((tag): tag is string => typeof tag === "string")
            : [],
          rating: numberValue(product.rating_avg) ?? 0,
          ratingCount: numberValue(product.rating_count) ?? 0,
          variants: variants
            .filter((variant) => text(variant.product_id) === productId)
            .map((variant) => ({
              id: text(variant.id) ?? "",
              name: text(variant.name) ?? "",
              sku: text(variant.sku) ?? "",
              price: numberValue(variant.price) ?? null,
              compareAtPrice: numberValue(variant.compare_at_price) ?? null,
              stock: numberValue(variant.stock) ?? 0,
              weightGrams: numberValue(variant.weight_grams) ?? null,
              status: text(variant.status) ?? "active",
            })),
        };
      }),
    },
  };
}
