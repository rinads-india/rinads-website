import type { FirstValueDefinition } from "./first-value";
import type { GlobalCatalogItemType } from "./ri-labs";

export type CatalogProductStatus = "draft" | "published" | "retired";
export type CatalogBillingMode = "one_time" | "subscription" | "usage";
export type CatalogProvider = "razorpay" | "stripe";

export type CatalogProviderRoute = {
  provider: CatalogProvider;
  currencies: readonly string[];
  markets: readonly string[];
};

export type CatalogProductDefinition = {
  key: string;
  name: string;
  type: GlobalCatalogItemType;
  version: string;
  status: CatalogProductStatus;
  capabilityKeys: readonly string[];
  firstValue?: FirstValueDefinition;
};

export type CatalogOfferDefinition = {
  key: string;
  productKey: string;
  catalogVersion: string;
  status: "draft" | "active" | "retired";
  billingMode: CatalogBillingMode;
  providerRoutes: readonly CatalogProviderRoute[];
  requiresTenant: boolean;
  planKey?: string;
  provisioningTemplate?: string;
  limits?: Readonly<Record<string, number | boolean | string>>;
};

export type TrustedEntitlementManifest = {
  productKey: string;
  offerKey: string;
  catalogVersion: string;
  productVersion: string;
  capabilityKeys: readonly string[];
  limits: Readonly<Record<string, number | boolean | string>>;
  requiresTenant: boolean;
  planKey?: string;
  provisioningTemplate?: string;
  firstValue?: FirstValueDefinition;
};

export type CatalogResolution =
  | { ok: true; entitlement: TrustedEntitlementManifest }
  | {
      ok: false;
      reason:
        | "product_not_published"
        | "offer_not_active"
        | "product_offer_mismatch"
        | "catalog_version_mismatch"
        | "tenant_template_missing"
        | "provider_route_missing";
    };

export function normalizeCatalogCurrency(currency: string): string {
  return currency.trim().toUpperCase();
}

export function normalizeCatalogMarket(market: string): string {
  return market.trim().toUpperCase();
}

export function offerSupportsCommercialRoute(
  offer: CatalogOfferDefinition,
  input: { provider: CatalogProvider; currency: string; market: string },
): boolean {
  const currency = normalizeCatalogCurrency(input.currency);
  const market = normalizeCatalogMarket(input.market);

  return offer.providerRoutes.some(
    (route) =>
      route.provider === input.provider &&
      route.currencies.map(normalizeCatalogCurrency).includes(currency) &&
      route.markets.map(normalizeCatalogMarket).includes(market),
  );
}

/**
 * Resolve the exact privileges granted by a commercial offer from trusted,
 * server-owned catalog definitions. Checkout/browser metadata must never be
 * allowed to supply capability keys, limits or provisioning templates.
 */
export function resolveTrustedEntitlementManifest(
  product: CatalogProductDefinition,
  offer: CatalogOfferDefinition,
  route?: { provider: CatalogProvider; currency: string; market: string },
): CatalogResolution {
  if (product.status !== "published") {
    return { ok: false, reason: "product_not_published" };
  }
  if (offer.status !== "active") {
    return { ok: false, reason: "offer_not_active" };
  }
  if (offer.productKey !== product.key) {
    return { ok: false, reason: "product_offer_mismatch" };
  }
  if (offer.catalogVersion !== product.version) {
    return { ok: false, reason: "catalog_version_mismatch" };
  }
  if (offer.requiresTenant && !offer.provisioningTemplate) {
    return { ok: false, reason: "tenant_template_missing" };
  }
  if (route && !offerSupportsCommercialRoute(offer, route)) {
    return { ok: false, reason: "provider_route_missing" };
  }

  return {
    ok: true,
    entitlement: {
      productKey: product.key,
      offerKey: offer.key,
      catalogVersion: offer.catalogVersion,
      productVersion: product.version,
      capabilityKeys: [...product.capabilityKeys],
      limits: { ...(offer.limits ?? {}) },
      requiresTenant: offer.requiresTenant,
      planKey: offer.planKey,
      provisioningTemplate: offer.provisioningTemplate,
      firstValue: product.firstValue,
    },
  };
}
