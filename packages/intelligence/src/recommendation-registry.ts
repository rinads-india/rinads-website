import type {
  RiFinding,
  RiRecommendation,
  RiRiskLevel,
  RiScope,
  RiSignal,
} from "./ri-types";

export type RiRecommendationContext = {
  scope: RiScope;
  signals: RiSignal[];
  findings?: RiFinding[];
};

export type RiRecommendationDefinition = {
  key: string;
  title: string;
  description: string;
  functions?: string[];
  industries?: string[];
  requiredSignalKeys?: string[];
  defaultRisk: RiRiskLevel;
  evaluate(context: RiRecommendationContext): RiRecommendation | null;
};

export class RiRecommendationRegistry {
  private readonly definitions = new Map<string, RiRecommendationDefinition>();

  constructor(definitions: RiRecommendationDefinition[] = []) {
    for (const definition of definitions) this.register(definition);
  }

  register(definition: RiRecommendationDefinition): void {
    if (!definition.key.trim()) throw new Error("RI recommendation key is required");
    if (this.definitions.has(definition.key)) {
      throw new Error(`RI recommendation already registered: ${definition.key}`);
    }
    this.definitions.set(definition.key, definition);
  }

  get(key: string): RiRecommendationDefinition | undefined {
    return this.definitions.get(key);
  }

  list(filter?: { industryKey?: string; functionKey?: string }): RiRecommendationDefinition[] {
    return [...this.definitions.values()].filter((definition) => {
      if (
        filter?.industryKey &&
        definition.industries?.length &&
        !definition.industries.includes(filter.industryKey)
      ) {
        return false;
      }
      if (
        filter?.functionKey &&
        definition.functions?.length &&
        !definition.functions.includes(filter.functionKey)
      ) {
        return false;
      }
      return true;
    });
  }

  evaluate(context: RiRecommendationContext): RiRecommendation[] {
    const signalKeys = new Set(context.signals.map((signal) => signal.key));

    return this.list({ industryKey: context.scope.industryKey })
      .filter((definition) =>
        (definition.requiredSignalKeys ?? []).every((signalKey) => signalKeys.has(signalKey))
      )
      .map((definition) => definition.evaluate(context))
      .filter((recommendation): recommendation is RiRecommendation => Boolean(recommendation));
  }
}

function numericSignal(context: RiRecommendationContext, key: string): RiSignal | undefined {
  return context.signals.find(
    (signal) => signal.key === key && typeof signal.value === "number"
  );
}

export const CORE_RI_RECOMMENDATIONS: RiRecommendationDefinition[] = [
  {
    key: "inventory.review_low_stock",
    title: "Review low-stock items",
    description: "Inspect products below reorder thresholds before service or order fulfilment is affected.",
    functions: ["inventory", "operations"],
    requiredSignalKeys: ["inventory.low_stock_count"],
    defaultRisk: "low",
    evaluate(context) {
      const signal = numericSignal(context, "inventory.low_stock_count");
      if (!signal || Number(signal.value) <= 0) return null;
      return {
        id: `recommendation:inventory.review_low_stock:${signal.id}`,
        key: "inventory.review_low_stock",
        dedupeKey: "inventory.review_low_stock",
        title: "Review low-stock items",
        rationale: `${signal.value} item(s) are below configured stock thresholds.`,
        expectedImpact: "Reduce avoidable stock-outs and service/order disruption.",
        impactScore: 72,
        urgencyScore: Number(signal.value) >= 10 ? 90 : 70,
        confidence: 0.98,
        risk: signal.severity ?? "low",
        ownerRole: "inventory",
        rinpoRole: "operations",
        evidence: signal.evidence,
        action: { category: "READ", toolKey: "ops_low_stock" },
      };
    },
  },
  {
    key: "growth.review_message_failures",
    title: "Resolve failed customer communications",
    description: "Review failed outbound messages before follow-up and campaigns lose coverage.",
    functions: ["growth", "customer"],
    industries: ["salon", "beauty-personal-care"],
    requiredSignalKeys: ["growth.message_failures"],
    defaultRisk: "low",
    evaluate(context) {
      const signal = numericSignal(context, "growth.message_failures");
      if (!signal || Number(signal.value) <= 0) return null;
      return {
        id: `recommendation:growth.review_message_failures:${signal.id}`,
        key: "growth.review_message_failures",
        dedupeKey: "growth.review_message_failures",
        title: "Resolve failed customer communications",
        rationale: `${signal.value} outbound message(s) require review.`,
        expectedImpact: "Restore communication coverage before customers or campaigns are missed.",
        impactScore: 76,
        urgencyScore: Number(signal.value) >= 20 ? 92 : 75,
        confidence: 0.97,
        risk: signal.severity ?? "low",
        ownerRole: "growth",
        rinpoRole: "growth",
        evidence: signal.evidence,
        action: { category: "READ", toolKey: "get_message_failures" },
      };
    },
  },
  {
    key: "salon.prepare_reactivation",
    title: "Prepare a client reactivation campaign",
    description: "Create a draft campaign for eligible inactive salon clients; sending remains separately governed.",
    functions: ["growth", "customer"],
    industries: ["salon", "beauty-personal-care"],
    requiredSignalKeys: ["salon.reactivation_candidates"],
    defaultRisk: "low",
    evaluate(context) {
      const signal = numericSignal(context, "salon.reactivation_candidates");
      if (!signal || Number(signal.value) <= 0) return null;
      return {
        id: `recommendation:salon.prepare_reactivation:${signal.id}`,
        key: "salon.prepare_reactivation",
        dedupeKey: "salon.prepare_reactivation",
        title: "Prepare a client reactivation campaign",
        rationale: `${signal.value} inactive client(s) are eligible for reactivation review.`,
        expectedImpact: "Recover dormant demand without sending any message until the existing campaign gates are satisfied.",
        impactScore: 82,
        urgencyScore: 65,
        confidence: 0.92,
        risk: "low",
        ownerRole: "growth",
        rinpoRole: "growth",
        evidence: signal.evidence,
        action: { category: "WRITE", toolKey: "create_reactivation_draft" },
      };
    },
  },
  {
    key: "finance.review_overdue_receivables",
    title: "Review overdue receivables",
    description: "Bring overdue balances into founder/finance attention before cash conversion deteriorates further.",
    functions: ["finance"],
    requiredSignalKeys: ["finance.overdue_receivables"],
    defaultRisk: "medium",
    evaluate(context) {
      const signal = numericSignal(context, "finance.overdue_receivables");
      if (!signal || Number(signal.value) <= 0) return null;
      return {
        id: `recommendation:finance.review_overdue_receivables:${signal.id}`,
        key: "finance.review_overdue_receivables",
        dedupeKey: "finance.review_overdue_receivables",
        title: "Review overdue receivables",
        rationale: `Overdue receivables currently total ${signal.value}.`,
        expectedImpact: "Improve collection visibility and cash conversion.",
        impactScore: 88,
        urgencyScore: 82,
        confidence: 0.97,
        risk: signal.severity ?? "medium",
        ownerRole: "finance",
        rinpoRole: "finance",
        evidence: signal.evidence,
      };
    },
  },
];

export const defaultRiRecommendationRegistry = new RiRecommendationRegistry(
  CORE_RI_RECOMMENDATIONS
);
