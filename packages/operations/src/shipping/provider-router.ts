import type { CourierAdapter } from "./shipment-service";

export const RINADS_COURIER_PROVIDER_KEYS = [
  "delhivery",
  "porter",
  "shiprocket",
  "sequel",
  "bvc",
  "dtdc",
  "local_fleet",
  "ondc_delivery",
] as const;

export type RinadsCourierProviderKey = (typeof RINADS_COURIER_PROVIDER_KEYS)[number] | (string & {});

export type CourierCapability = "cod" | "reverse" | "same_day" | "scheduled" | "high_value";

export type CourierParcelType = "document" | "parcel" | "commerce" | "bulk" | "high_value" | "other";

export type CourierQuoteInput = {
  organizationId: string;
  orderId: string;
  packageId: string;
  weightGrams?: number;
  pickupPincode?: string;
  destinationPincode?: string;
  dimensionsCm?: {
    length: number;
    width: number;
    height: number;
  };
  declaredValueMinor?: number;
  codAmountMinor?: number;
  parcelType?: CourierParcelType;
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

export type CourierRoutingStrategy = "priority" | "lowest_cost" | "fastest" | "intelligence";

export type CourierRoutingEvidence = {
  /** Historical delivered / dispatched ratio for the relevant tenant/route cohort, 0..1. */
  deliverySuccessRate?: number;
  /** Historical return-to-origin ratio for the relevant tenant/route cohort, 0..1. */
  rtoRate?: number;
  /** Confidence that the quoted SLA will be met, 0..1. */
  slaConfidence?: number;
  /** Expected RINADS/merchant contribution margin after provider cost. May be negative. */
  estimatedMarginMinor?: number;
};

export type CourierIntelligenceWeights = {
  cost: number;
  eta: number;
  deliverySuccess: number;
  rto: number;
  slaConfidence: number;
  margin: number;
  priority: number;
};

export type CourierRoutingPolicy = {
  strategy: CourierRoutingStrategy;
  maxCostMinor?: number;
  maxEtaHours?: number;
  intelligenceWeights?: Partial<CourierIntelligenceWeights>;
};

export type CourierProviderDefinition = {
  key: RinadsCourierProviderKey;
  adapter: CourierAdapter;
  enabled: boolean;
  priority: number;
  capabilities: CourierCapability[];
  quote(input: CourierQuoteInput): Promise<CourierQuote>;
  /** Optional governed evidence hook. Missing telemetry is treated as neutral, never invented. */
  intelligence?(
    input: CourierQuoteInput,
    quote: CourierQuote
  ): CourierRoutingEvidence | Promise<CourierRoutingEvidence>;
};

export type CourierIntelligenceDecision = {
  score: number;
  evidence: CourierRoutingEvidence;
};

export type CourierRoutingCandidate = {
  provider: CourierProviderDefinition;
  quote: CourierQuote;
  intelligence?: CourierIntelligenceDecision;
};

export type CourierRouteResult =
  | { ok: true; candidate: CourierRoutingCandidate }
  | { ok: false; code: "NO_PROVIDER"; message: string; quotes: CourierQuote[] };

const DEFAULT_INTELLIGENCE_WEIGHTS: CourierIntelligenceWeights = {
  cost: 0.2,
  eta: 0.15,
  deliverySuccess: 0.25,
  rto: 0.15,
  slaConfidence: 0.1,
  margin: 0.05,
  priority: 0.1,
};

function nonNegativeFinite(value: number | undefined): boolean {
  return value === undefined || (Number.isFinite(value) && value >= 0);
}

function finite(value: number | undefined): boolean {
  return value === undefined || Number.isFinite(value);
}

function ratio(value: number | undefined): boolean {
  return value === undefined || (Number.isFinite(value) && value >= 0 && value <= 1);
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

function validateEvidence(evidence: CourierRoutingEvidence, providerKey: string): CourierRoutingEvidence {
  if (!ratio(evidence.deliverySuccessRate)) {
    throw new Error(`Courier intelligence ${providerKey} has an invalid delivery success rate.`);
  }
  if (!ratio(evidence.rtoRate)) {
    throw new Error(`Courier intelligence ${providerKey} has an invalid RTO rate.`);
  }
  if (!ratio(evidence.slaConfidence)) {
    throw new Error(`Courier intelligence ${providerKey} has an invalid SLA confidence.`);
  }
  if (!finite(evidence.estimatedMarginMinor)) {
    throw new Error(`Courier intelligence ${providerKey} has an invalid estimated margin.`);
  }
  return evidence;
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
  if (strategy === "intelligence") {
    const aScore = a.intelligence?.score ?? Number.NEGATIVE_INFINITY;
    const bScore = b.intelligence?.score ?? Number.NEGATIVE_INFINITY;
    if (aScore !== bScore) return bScore - aScore;
  }

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

function resolveWeights(overrides?: Partial<CourierIntelligenceWeights>): CourierIntelligenceWeights {
  const weights = { ...DEFAULT_INTELLIGENCE_WEIGHTS, ...overrides };
  const values = Object.values(weights);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("Courier intelligence weights must be finite non-negative numbers.");
  }
  if (values.every((value) => value === 0)) {
    throw new Error("Courier intelligence weights cannot all be zero.");
  }
  return weights;
}

function range(values: Array<number | undefined>): { min: number; max: number } | null {
  const finiteValues = values.filter((value): value is number => value !== undefined && Number.isFinite(value));
  if (finiteValues.length === 0) return null;
  return { min: Math.min(...finiteValues), max: Math.max(...finiteValues) };
}

function lowerIsBetter(value: number | undefined, metricRange: { min: number; max: number } | null): number {
  if (value === undefined || !metricRange) return 0;
  if (metricRange.max === metricRange.min) return 1;
  return 1 - (value - metricRange.min) / (metricRange.max - metricRange.min);
}

function higherIsBetter(value: number | undefined, metricRange: { min: number; max: number } | null): number {
  if (value === undefined || !metricRange) return 0.5;
  if (metricRange.max === metricRange.min) return 1;
  return (value - metricRange.min) / (metricRange.max - metricRange.min);
}

async function scoreIntelligenceCandidates(
  candidates: CourierRoutingCandidate[],
  input: CourierQuoteInput,
  policy: CourierRoutingPolicy
): Promise<CourierRoutingCandidate[]> {
  const weights = resolveWeights(policy.intelligenceWeights);
  const evidenceByKey = new Map<string, CourierRoutingEvidence>();

  await Promise.all(
    candidates.map(async (candidate) => {
      let evidence: CourierRoutingEvidence = {};
      if (candidate.provider.intelligence) {
        try {
          evidence = validateEvidence(
            await candidate.provider.intelligence(input, candidate.quote),
            candidate.provider.key
          );
        } catch {
          // Telemetry must never turn into invented evidence. Unknown remains neutral below.
          evidence = {};
        }
      }
      evidenceByKey.set(candidate.provider.key, evidence);
    })
  );

  const costRange = range(candidates.map((candidate) => candidate.quote.estimatedCostMinor));
  const etaRange = range(candidates.map((candidate) => candidate.quote.etaHours));
  const marginRange = range(
    candidates.map((candidate) => evidenceByKey.get(candidate.provider.key)?.estimatedMarginMinor)
  );
  const priorityRange = range(candidates.map((candidate) => candidate.provider.priority));
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);

  return candidates.map((candidate) => {
    const evidence = evidenceByKey.get(candidate.provider.key) ?? {};
    const components = {
      cost: lowerIsBetter(candidate.quote.estimatedCostMinor, costRange),
      eta: lowerIsBetter(candidate.quote.etaHours, etaRange),
      deliverySuccess: evidence.deliverySuccessRate ?? 0.5,
      rto: 1 - (evidence.rtoRate ?? 0.5),
      slaConfidence: evidence.slaConfidence ?? 0.5,
      margin: higherIsBetter(evidence.estimatedMarginMinor, marginRange),
      priority: lowerIsBetter(candidate.provider.priority, priorityRange),
    };

    const weighted =
      components.cost * weights.cost +
      components.eta * weights.eta +
      components.deliverySuccess * weights.deliverySuccess +
      components.rto * weights.rto +
      components.slaConfidence * weights.slaConfidence +
      components.margin * weights.margin +
      components.priority * weights.priority;

    return {
      ...candidate,
      intelligence: {
        score: Math.round((weighted / totalWeight) * 10_000) / 100,
        evidence,
      },
    };
  });
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
    let candidates: CourierRoutingCandidate[] = [];

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

    if (policy.strategy === "intelligence") {
      candidates = await scoreIntelligenceCandidates(candidates, input, policy);
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
