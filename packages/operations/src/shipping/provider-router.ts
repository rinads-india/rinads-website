import type { CourierAdapter } from "./shipment-service";

export const RINADS_COURIER_PROVIDER_KEYS = [
  "delhivery",
  "porter",
  "shiprocket",
  "sequel",
  "bvc",
  "dtdc",
  "local_fleet",
] as const;

export type RinadsCourierProviderKey = (typeof RINADS_COURIER_PROVIDER_KEYS)[number] | (string & {});

export type CourierCapability = "cod" | "reverse" | "same_day" | "scheduled" | "high_value";

export type CourierQuoteInput = {
  organizationId: string;
  orderId: string;
  packageId: string;
  weightGrams?: number;
  destinationPincode?: string;
  requiredCapabilities?: CourierCapability[];
};

export type CourierQuote = {
  providerKey: RinadsCourierProviderKey;
  serviceable: boolean;
  service?: string;
  estimatedCostMinor?: number;
  etaHours?: number;
  reason?: string;
};

export type CourierRoutingStrategy = "priority" | "lowest_cost" | "fastest";

export type CourierRoutingPolicy = {
  strategy: CourierRoutingStrategy;
  maxCostMinor?: number;
  maxEtaHours?: number;
};

export type CourierProviderDefinition = {
  key: RinadsCourierProviderKey;
  adapter: CourierAdapter;
  enabled: boolean;
  priority: number;
  capabilities: CourierCapability[];
  quote(input: CourierQuoteInput): Promise<CourierQuote>;
};

export type CourierRoutingCandidate = {
  provider: CourierProviderDefinition;
  quote: CourierQuote;
};

export type CourierRouteResult =
  | { ok: true; candidate: CourierRoutingCandidate }
  | { ok: false; code: "NO_PROVIDER"; message: string; quotes: CourierQuote[] };

function nonNegativeFinite(value: number | undefined): boolean {
  return value === undefined || (Number.isFinite(value) && value >= 0);
}

function validateQuote(quote: CourierQuote, providerKey: string): CourierQuote {
  if (quote.providerKey !== providerKey) {
    throw new Error(`Courier quote provider mismatch: expected ${providerKey}, received ${quote.providerKey}.`);
  }
  if (!nonNegativeFinite(quote.estimatedCostMinor)) {
    throw new Error(`Courier quote ${providerKey} has an invalid estimated cost.`);
  }
  if (!nonNegativeFinite(quote.etaHours)) {
    throw new Error(`Courier quote ${providerKey} has an invalid ETA.`);
  }
  return quote;
}

function supportsRequiredCapabilities(
  provider: CourierProviderDefinition,
  required: readonly CourierCapability[]
): boolean {
  return required.every((capability) => provider.capabilities.includes(capability));
}

function compareCandidates(
  a: CourierRoutingCandidate,
  b: CourierRoutingCandidate,
  strategy: CourierRoutingStrategy
): number {
  if (strategy === "lowest_cost") {
    const aCost = a.quote.estimatedCostMinor ?? Number.POSITIVE_INFINITY;
    const bCost = b.quote.estimatedCostMinor ?? Number.POSITIVE_INFINITY;
    if (aCost !== bCost) return aCost - bCost;
  }

  if (strategy === "fastest") {
    const aEta = a.quote.etaHours ?? Number.POSITIVE_INFINITY;
    const bEta = b.quote.etaHours ?? Number.POSITIVE_INFINITY;
    if (aEta !== bEta) return aEta - bEta;
  }

  if (a.provider.priority !== b.provider.priority) {
    return a.provider.priority - b.provider.priority;
  }

  const aCost = a.quote.estimatedCostMinor ?? Number.POSITIVE_INFINITY;
  const bCost = b.quote.estimatedCostMinor ?? Number.POSITIVE_INFINITY;
  if (aCost !== bCost) return aCost - bCost;

  const aEta = a.quote.etaHours ?? Number.POSITIVE_INFINITY;
  const bEta = b.quote.etaHours ?? Number.POSITIVE_INFINITY;
  if (aEta !== bEta) return aEta - bEta;

  return a.provider.key.localeCompare(b.provider.key);
}

export class CourierProviderRouter {
  private readonly byKey: Map<string, CourierProviderDefinition>;

  constructor(providers: readonly CourierProviderDefinition[]) {
    this.byKey = new Map();
    for (const provider of providers) {
      if (!provider.key.trim()) throw new Error("Courier provider key is required.");
      if (!Number.isSafeInteger(provider.priority) || provider.priority < 0) {
        throw new Error(`Courier provider ${provider.key} has an invalid priority.`);
      }
      if (this.byKey.has(provider.key)) {
        throw new Error(`Duplicate courier provider key: ${provider.key}.`);
      }
      this.byKey.set(provider.key, provider);
    }
  }

  getProvider(providerKey: string): CourierProviderDefinition | null {
    return this.byKey.get(providerKey) ?? null;
  }

  async quoteAll(input: CourierQuoteInput): Promise<CourierQuote[]> {
    const required = input.requiredCapabilities ?? [];
    const enabled = [...this.byKey.values()].filter(
      (provider) => provider.enabled && supportsRequiredCapabilities(provider, required)
    );

    const quotes = await Promise.all(
      enabled.map(async (provider): Promise<CourierQuote> => {
        try {
          return validateQuote(await provider.quote(input), provider.key);
        } catch (error) {
          return {
            providerKey: provider.key,
            serviceable: false,
            reason: error instanceof Error ? error.message : "Provider quote failed.",
          };
        }
      })
    );

    return quotes.sort((a, b) => a.providerKey.localeCompare(b.providerKey));
  }

  async route(
    input: CourierQuoteInput,
    policy: CourierRoutingPolicy = { strategy: "priority" }
  ): Promise<CourierRouteResult> {
    const quotes = await this.quoteAll(input);
    const candidates: CourierRoutingCandidate[] = [];

    for (const quote of quotes) {
      if (!quote.serviceable) continue;
      if (policy.maxCostMinor !== undefined) {
        if (quote.estimatedCostMinor === undefined || quote.estimatedCostMinor > policy.maxCostMinor) continue;
      }
      if (policy.maxEtaHours !== undefined) {
        if (quote.etaHours === undefined || quote.etaHours > policy.maxEtaHours) continue;
      }
      const provider = this.byKey.get(quote.providerKey);
      if (!provider) continue;
      candidates.push({ provider, quote });
    }

    candidates.sort((a, b) => compareCandidates(a, b, policy.strategy));
    const candidate = candidates[0];
    if (!candidate) {
      return {
        ok: false,
        code: "NO_PROVIDER",
        message: "No configured courier provider satisfies serviceability and routing policy.",
        quotes,
      };
    }

    return { ok: true, candidate };
  }

  async createShipment(
    input: CourierQuoteInput,
    policy: CourierRoutingPolicy = { strategy: "priority" }
  ): Promise<{
    providerKey: string;
    quote: CourierQuote;
    shipment: Awaited<ReturnType<CourierAdapter["createShipment"]>>;
  }> {
    const route = await this.route(input, policy);
    if (!route.ok) throw new Error(route.message);

    const shipment = await route.candidate.provider.adapter.createShipment({
      orderId: input.orderId,
      packageId: input.packageId,
      weightGrams: input.weightGrams,
      destinationPincode: input.destinationPincode,
    });

    return {
      providerKey: route.candidate.provider.key,
      quote: route.candidate.quote,
      shipment,
    };
  }
}
