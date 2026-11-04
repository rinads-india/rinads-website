export type RiMetricDomain =
  | "sales"
  | "finance"
  | "operations"
  | "inventory"
  | "growth"
  | "customer"
  | "salon";

export type RiMetricValueType = "count" | "currency" | "percentage" | "duration" | "number";
export type RiMetricTimeGrain = "realtime" | "daily" | "weekly" | "monthly" | "quarterly";

export type RiMetricThresholds = {
  warningBelow?: number;
  warningAbove?: number;
  criticalBelow?: number;
  criticalAbove?: number;
};

export type RiMetricDefinition = {
  key: string;
  label: string;
  description: string;
  domain: RiMetricDomain;
  valueType: RiMetricValueType;
  timeGrain: RiMetricTimeGrain;
  sourceProviderKey: string;
  ownerRole?: string;
  industries?: string[];
  target?: number;
  thresholds?: RiMetricThresholds;
};

export class RiMetricRegistry {
  private readonly metrics = new Map<string, RiMetricDefinition>();

  constructor(definitions: RiMetricDefinition[] = []) {
    for (const definition of definitions) this.register(definition);
  }

  register(definition: RiMetricDefinition): void {
    if (!definition.key.trim()) throw new Error("RI metric key is required");
    if (this.metrics.has(definition.key)) {
      throw new Error(`RI metric already registered: ${definition.key}`);
    }
    this.metrics.set(definition.key, Object.freeze({ ...definition }));
  }

  get(key: string): RiMetricDefinition | undefined {
    return this.metrics.get(key);
  }

  has(key: string): boolean {
    return this.metrics.has(key);
  }

  list(filter?: { domain?: RiMetricDomain; industryKey?: string }): RiMetricDefinition[] {
    return [...this.metrics.values()].filter((metric) => {
      if (filter?.domain && metric.domain !== filter.domain) return false;
      if (
        filter?.industryKey &&
        metric.industries?.length &&
        !metric.industries.includes(filter.industryKey)
      ) {
        return false;
      }
      return true;
    });
  }
}

export const CORE_RI_METRICS: RiMetricDefinition[] = [
  {
    key: "sales.qualified_leads",
    label: "Qualified leads",
    description: "Active prospects with a validated need and next step.",
    domain: "sales",
    valueType: "count",
    timeGrain: "realtime",
    sourceProviderKey: "sales",
    ownerRole: "sales",
  },
  {
    key: "finance.overdue_receivables",
    label: "Overdue receivables",
    description: "Outstanding invoice balance past due date.",
    domain: "finance",
    valueType: "currency",
    timeGrain: "realtime",
    sourceProviderKey: "finance",
    ownerRole: "finance",
  },
  {
    key: "operations.overdue_work",
    label: "Overdue work",
    description: "Open work items whose due date has passed.",
    domain: "operations",
    valueType: "count",
    timeGrain: "realtime",
    sourceProviderKey: "work",
    ownerRole: "operations",
    thresholds: { warningAbove: 0, criticalAbove: 5 },
  },
  {
    key: "inventory.low_stock_count",
    label: "Low stock items",
    description: "Products below configured reorder thresholds.",
    domain: "inventory",
    valueType: "count",
    timeGrain: "realtime",
    sourceProviderKey: "inventory",
    ownerRole: "inventory",
    thresholds: { warningAbove: 0, criticalAbove: 10 },
  },
  {
    key: "growth.message_failures",
    label: "Message failures",
    description: "Outbound campaign messages in failed or dead-letter state.",
    domain: "growth",
    valueType: "count",
    timeGrain: "realtime",
    sourceProviderKey: "growth",
    ownerRole: "growth",
    thresholds: { warningAbove: 0, criticalAbove: 20 },
  },
  {
    key: "salon.empty_slots",
    label: "Empty bookable slots",
    description: "Bookable capacity remaining for the selected salon day/location.",
    domain: "salon",
    valueType: "count",
    timeGrain: "daily",
    sourceProviderKey: "salon",
    ownerRole: "operations",
    industries: ["salon", "beauty-personal-care"],
  },
  {
    key: "salon.rebooking_rate",
    label: "Rebooking rate",
    description: "Share of eligible completed visits that produce a future booking.",
    domain: "salon",
    valueType: "percentage",
    timeGrain: "monthly",
    sourceProviderKey: "salon",
    ownerRole: "customer",
    industries: ["salon", "beauty-personal-care"],
    target: 60,
    thresholds: { warningBelow: 40, criticalBelow: 25 },
  },
];

export const defaultRiMetricRegistry = new RiMetricRegistry(CORE_RI_METRICS);
