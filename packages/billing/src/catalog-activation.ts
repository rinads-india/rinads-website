export type CatalogActivationNotes = {
  organizationId: string;
  productKey: string;
  offerKey: string;
  catalogVersion: string;
  purchaseIntentId: string;
};

export type CatalogBillingMode = "one_time" | "subscription";
export type CatalogBillingProvider = "razorpay" | "stripe";

/**
 * Trusted commercial policy loaded from the server-side RINADS catalog.
 * Capabilities and entitlements intentionally do not come from payment metadata.
 */
export type CatalogActivationPolicy = {
  productKey: string;
  offerKey: string;
  catalogVersion: string;
  billingMode: CatalogBillingMode;
  allowedCurrencies: readonly string[];
};

/**
 * Provider adapters should emit this normalized signal only after validating
 * the provider webhook signature and deduplicating the provider event ID.
 */
export type VerifiedCatalogBillingSignal = {
  provider: CatalogBillingProvider;
  providerEventId: string;
  kind: "one_time_paid" | "subscription_active";
  status: "paid" | "active";
  currency: string;
  notes?: Partial<CatalogActivationNotes>;
};

export type CatalogActivationDecision =
  | {
      activate: true;
      notes: CatalogActivationNotes;
      provider: CatalogBillingProvider;
      providerEventId: string;
    }
  | {
      activate: false;
      reason:
        | "activation_metadata_missing"
        | "catalog_policy_mismatch"
        | "currency_not_allowed"
        | "billing_mode_mismatch"
        | "commercial_state_not_verified";
    };

function hasCatalogActivationNotes(
  notes?: Partial<CatalogActivationNotes>,
): notes is CatalogActivationNotes {
  return Boolean(
    notes?.organizationId &&
      notes?.productKey &&
      notes?.offerKey &&
      notes?.catalogVersion &&
      notes?.purchaseIntentId,
  );
}

function metadataMatchesPolicy(
  notes: CatalogActivationNotes,
  policy: CatalogActivationPolicy,
): boolean {
  return (
    notes.productKey === policy.productKey &&
    notes.offerKey === policy.offerKey &&
    notes.catalogVersion === policy.catalogVersion
  );
}

/**
 * Converts a signature-verified, provider-normalized commercial event into an
 * activation decision. The caller must resolve `policy` from the trusted
 * server-side catalog; never construct it from browser checkout input.
 */
export function evaluateCatalogActivationSignal(
  signal: VerifiedCatalogBillingSignal,
  policy: CatalogActivationPolicy,
): CatalogActivationDecision {
  if (!hasCatalogActivationNotes(signal.notes)) {
    return { activate: false, reason: "activation_metadata_missing" };
  }

  if (!metadataMatchesPolicy(signal.notes, policy)) {
    return { activate: false, reason: "catalog_policy_mismatch" };
  }

  const currency = signal.currency.trim().toUpperCase();
  const allowedCurrencies = policy.allowedCurrencies.map((value) => value.trim().toUpperCase());
  if (!allowedCurrencies.includes(currency)) {
    return { activate: false, reason: "currency_not_allowed" };
  }

  if (
    (policy.billingMode === "one_time" && signal.kind !== "one_time_paid") ||
    (policy.billingMode === "subscription" && signal.kind !== "subscription_active")
  ) {
    return { activate: false, reason: "billing_mode_mismatch" };
  }

  if (
    (signal.kind === "one_time_paid" && signal.status !== "paid") ||
    (signal.kind === "subscription_active" && signal.status !== "active")
  ) {
    return { activate: false, reason: "commercial_state_not_verified" };
  }

  return {
    activate: true,
    notes: signal.notes,
    provider: signal.provider,
    providerEventId: signal.providerEventId,
  };
}

/**
 * Payment-provider metadata contains identifiers only. Entitlements,
 * capabilities, quotas and provisioning templates are resolved from the
 * trusted catalog after the verified payment event is accepted.
 */
export function buildCatalogProviderMetadata(
  notes: CatalogActivationNotes,
): Record<string, string> {
  if (!hasCatalogActivationNotes(notes)) {
    throw new Error("CATALOG_ACTIVATION_METADATA_REQUIRED");
  }

  return {
    organization_id: notes.organizationId,
    product_key: notes.productKey,
    offer_key: notes.offerKey,
    catalog_version: notes.catalogVersion,
    purchase_intent_id: notes.purchaseIntentId,
  };
}
