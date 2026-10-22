import {
  CourierProviderRouter,
  type CourierCapability,
  type CourierIntelligenceWeights,
  type CourierProviderDefinition,
  type CourierQuoteInput,
  type CourierRouteResult,
  type CourierRoutingPolicy,
  type CourierRoutingStrategy,
} from "./provider-router";

export type LogisticsVerificationState =
  | "unverified"
  | "sandbox_passed"
  | "controlled_shipment_passed"
  | "suspended";

export type LogisticsCredentialSource = "none" | "environment" | "vault" | "connector";

export type LogisticsProviderConfig = {
  organizationId: string;
  providerKey: string;
  enabled: boolean;
  priority: number;
  capabilities: CourierCapability[];
  credentialSource: LogisticsCredentialSource;
  credentialKey?: string;
  verificationState: LogisticsVerificationState;
};

export type LogisticsAutonomyMode = "recommend_only" | "approve_then_act" | "auto_low_risk";

export type LogisticsRoutingPolicyConfig = {
  organizationId: string;
  strategy: CourierRoutingStrategy;
  maxCostMinor?: number;
  maxEtaHours?: number;
  intelligenceWeights?: Partial<CourierIntelligenceWeights>;
  autonomyMode: LogisticsAutonomyMode;
  humanApprovalDeclaredValueMinor: number;
  humanApprovalCodMinor: number;
  requireApprovalForHighValue: boolean;
  requireApprovalForFirstProviderUse: boolean;
};

export type LogisticsDecisionStage =
  | "observe"
  | "understand"
  | "recommend"
  | "authorize"
  | "act"
  | "audit"
  | "reject";

export type LogisticsDecisionActorType =
  | "user"
  | "system"
  | "rinads_intelligence"
  | "rinpo_runtime"
  | "provider";

export type LogisticsDecisionEvent = {
  organizationId: string;
  correlationId: string;
  orderId?: string;
  packageId?: string;
  shipmentId?: string;
  stage: LogisticsDecisionStage;
  providerKey?: string;
  routingStrategy?: CourierRoutingStrategy;
  decisionScore?: number;
  approvalRequired: boolean;
  evidence: Record<string, unknown>;
  policySnapshot: Record<string, unknown>;
  actorType: LogisticsDecisionActorType;
  actorId?: string;
  occurredAt: string;
};

export type LogisticsRuntimeRepository = {
  listProviderConfigs(organizationId: string): Promise<LogisticsProviderConfig[]>;
  getRoutingPolicy(organizationId: string): Promise<LogisticsRoutingPolicyConfig | null>;
  appendDecisionEvent(event: LogisticsDecisionEvent): Promise<void>;
  hasSuccessfulProviderExecution?(
    organizationId: string,
    providerKey: string
  ): Promise<boolean>;
};

export type LogisticsRuntimeMode = "production" | "verification";

export type LogisticsRuntimeContext = {
  organizationId: string;
  actorType: "user" | "system" | "rinads_intelligence" | "rinpo_runtime";
  actorId?: string;
  correlationId?: string;
  mode?: LogisticsRuntimeMode;
};

export type LogisticsRuntimeRouteResult = {
  correlationId: string;
  policy: LogisticsRoutingPolicyConfig;
  route: CourierRouteResult;
};

export type LogisticsApproval = {
  approved: true;
  reference?: string;
  approvedByActorId?: string;
};

export type LogisticsCreateShipmentResult =
  | {
      ok: true;
      correlationId: string;
      providerKey: string;
      quote: Extract<CourierRouteResult, { ok: true }>["candidate"]["quote"];
      shipment: Awaited<ReturnType<CourierProviderDefinition["adapter"]["createShipment"]>>;
    }
  | {
      ok: false;
      correlationId: string;
      code: "NO_PROVIDER" | "RECOMMEND_ONLY" | "APPROVAL_REQUIRED" | "PROVIDER_ERROR";
      message: string;
      approvalReasons?: string[];
    };

const DEFAULT_POLICY = {
  strategy: "intelligence",
  autonomyMode: "recommend_only",
  humanApprovalDeclaredValueMinor: 500_000,
  humanApprovalCodMinor: 500_000,
  requireApprovalForHighValue: true,
  requireApprovalForFirstProviderUse: true,
} as const;

function createCorrelationId(): string {
  return `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function policySnapshot(policy: LogisticsRoutingPolicyConfig): Record<string, unknown> {
  return {
    strategy: policy.strategy,
    maxCostMinor: policy.maxCostMinor ?? null,
    maxEtaHours: policy.maxEtaHours ?? null,
    intelligenceWeights: policy.intelligenceWeights ?? null,
    autonomyMode: policy.autonomyMode,
    humanApprovalDeclaredValueMinor: policy.humanApprovalDeclaredValueMinor,
    humanApprovalCodMinor: policy.humanApprovalCodMinor,
    requireApprovalForHighValue: policy.requireApprovalForHighValue,
    requireApprovalForFirstProviderUse: policy.requireApprovalForFirstProviderUse,
  };
}

function toRoutingPolicy(policy: LogisticsRoutingPolicyConfig): CourierRoutingPolicy {
  return {
    strategy: policy.strategy,
    maxCostMinor: policy.maxCostMinor,
    maxEtaHours: policy.maxEtaHours,
    intelligenceWeights: policy.intelligenceWeights,
  };
}

function resolvePolicy(
  organizationId: string,
  stored: LogisticsRoutingPolicyConfig | null
): LogisticsRoutingPolicyConfig {
  if (stored) {
    if (stored.organizationId !== organizationId) {
      throw new Error("Logistics routing policy organization mismatch.");
    }
    return stored;
  }

  return {
    organizationId,
    ...DEFAULT_POLICY,
  };
}

function verificationAllowed(
  state: LogisticsVerificationState,
  mode: LogisticsRuntimeMode
): boolean {
  if (state === "suspended" || state === "unverified") return false;
  if (mode === "verification") {
    return state === "sandbox_passed" || state === "controlled_shipment_passed";
  }
  return state === "controlled_shipment_passed";
}

/**
 * Hydrates immutable carrier adapter definitions with tenant-scoped configuration.
 * A DB row cannot create a provider that is absent from the code-side catalog, and
 * cannot grant a capability the adapter does not declare.
 */
export function hydrateCourierProviders(
  catalog: readonly CourierProviderDefinition[],
  configs: readonly LogisticsProviderConfig[],
  mode: LogisticsRuntimeMode = "production"
): CourierProviderDefinition[] {
  const byKey = new Map(configs.map((config) => [config.providerKey, config]));

  return catalog.map((provider) => {
    const config = byKey.get(provider.key);
    if (!config) return { ...provider, enabled: false };

    if (!Number.isSafeInteger(config.priority) || config.priority < 0) {
      throw new Error(`Logistics provider ${config.providerKey} has an invalid tenant priority.`);
    }

    const configuredCapabilities =
      config.capabilities.length === 0
        ? provider.capabilities
        : config.capabilities.filter((capability) => provider.capabilities.includes(capability));

    return {
      ...provider,
      enabled:
        provider.enabled &&
        config.enabled &&
        verificationAllowed(config.verificationState, mode),
      priority: config.priority,
      capabilities: configuredCapabilities,
    };
  });
}

function quoteEvidence(route: CourierRouteResult): Record<string, unknown> {
  if (!route.ok) {
    return {
      result: "no_provider",
      quoteCount: route.quotes.length,
      serviceableQuoteCount: route.quotes.filter((quote) => quote.serviceable).length,
    };
  }

  return {
    result: "recommended",
    providerKey: route.candidate.provider.key,
    service: route.candidate.quote.service ?? null,
    estimatedCostMinor: route.candidate.quote.estimatedCostMinor ?? null,
    etaHours: route.candidate.quote.etaHours ?? null,
    score: route.candidate.intelligence?.score ?? null,
    intelligenceEvidence: route.candidate.intelligence?.evidence ?? null,
  };
}

export class LogisticsRuntimeService {
  constructor(
    private readonly repository: LogisticsRuntimeRepository,
    private readonly providerCatalog: readonly CourierProviderDefinition[]
  ) {}

  private async append(
    ctx: LogisticsRuntimeContext,
    correlationId: string,
    input: CourierQuoteInput,
    policy: LogisticsRoutingPolicyConfig,
    event: Omit<LogisticsDecisionEvent, "organizationId" | "correlationId" | "orderId" | "packageId" | "policySnapshot" | "occurredAt">
  ): Promise<void> {
    await this.repository.appendDecisionEvent({
      organizationId: ctx.organizationId,
      correlationId,
      orderId: input.orderId,
      packageId: input.packageId,
      policySnapshot: policySnapshot(policy),
      occurredAt: new Date().toISOString(),
      ...event,
    });
  }

  async route(
    ctx: LogisticsRuntimeContext,
    input: CourierQuoteInput
  ): Promise<LogisticsRuntimeRouteResult> {
    if (input.organizationId !== ctx.organizationId) {
      throw new Error("Shipment intent organization mismatch.");
    }

    const correlationId = ctx.correlationId ?? createCorrelationId();
    const [configs, storedPolicy] = await Promise.all([
      this.repository.listProviderConfigs(ctx.organizationId),
      this.repository.getRoutingPolicy(ctx.organizationId),
    ]);
    const policy = resolvePolicy(ctx.organizationId, storedPolicy);
    const providers = hydrateCourierProviders(
      this.providerCatalog,
      configs,
      ctx.mode ?? "production"
    );

    await this.append(ctx, correlationId, input, policy, {
      stage: "observe",
      approvalRequired: false,
      evidence: {
        requiredCapabilities: input.requiredCapabilities ?? [],
        parcelType: input.parcelType ?? null,
        weightGrams: input.weightGrams ?? null,
        declaredValueMinor: input.declaredValueMinor ?? null,
        codAmountMinor: input.codAmountMinor ?? null,
      },
      actorType: ctx.actorType,
      actorId: ctx.actorId,
    });

    await this.append(ctx, correlationId, input, policy, {
      stage: "understand",
      routingStrategy: policy.strategy,
      approvalRequired: false,
      evidence: {
        configuredProviderCount: configs.length,
        executableProviderCount: providers.filter((provider) => provider.enabled).length,
        runtimeMode: ctx.mode ?? "production",
      },
      actorType: "rinads_intelligence",
    });

    const router = new CourierProviderRouter(providers);
    const route = await router.route(input, toRoutingPolicy(policy));

    if (!route.ok) {
      await this.append(ctx, correlationId, input, policy, {
        stage: "reject",
        routingStrategy: policy.strategy,
        approvalRequired: false,
        evidence: quoteEvidence(route),
        actorType: "rinads_intelligence",
      });
    } else {
      await this.append(ctx, correlationId, input, policy, {
        stage: "recommend",
        providerKey: route.candidate.provider.key,
        routingStrategy: policy.strategy,
        decisionScore: route.candidate.intelligence?.score,
        approvalRequired: policy.autonomyMode !== "auto_low_risk",
        evidence: quoteEvidence(route),
        actorType: "rinads_intelligence",
      });
    }

    return { correlationId, policy, route };
  }

  private async approvalReasons(
    policy: LogisticsRoutingPolicyConfig,
    input: CourierQuoteInput,
    providerKey: string
  ): Promise<string[]> {
    const reasons: string[] = [];

    if (
      policy.requireApprovalForHighValue &&
      input.declaredValueMinor !== undefined &&
      input.declaredValueMinor >= policy.humanApprovalDeclaredValueMinor
    ) {
      reasons.push("declared_value_threshold");
    }

    if (
      input.codAmountMinor !== undefined &&
      input.codAmountMinor >= policy.humanApprovalCodMinor
    ) {
      reasons.push("cod_threshold");
    }

    if (policy.requireApprovalForFirstProviderUse) {
      const previouslyExecuted = this.repository.hasSuccessfulProviderExecution
        ? await this.repository.hasSuccessfulProviderExecution(policy.organizationId, providerKey)
        : false;
      if (!previouslyExecuted) reasons.push("first_provider_use");
    }

    return reasons;
  }

  async createShipment(
    ctx: LogisticsRuntimeContext,
    input: CourierQuoteInput,
    options: { approval?: LogisticsApproval } = {}
  ): Promise<LogisticsCreateShipmentResult> {
    const decision = await this.route(ctx, input);
    if (!decision.route.ok) {
      return {
        ok: false,
        correlationId: decision.correlationId,
        code: "NO_PROVIDER",
        message: decision.route.message,
      };
    }

    const provider = decision.route.candidate.provider;
    const policy = decision.policy;

    if (policy.autonomyMode === "recommend_only") {
      await this.append(ctx, decision.correlationId, input, policy, {
        stage: "authorize",
        providerKey: provider.key,
        routingStrategy: policy.strategy,
        decisionScore: decision.route.candidate.intelligence?.score,
        approvalRequired: true,
        evidence: { authorized: false, reason: "recommend_only_policy" },
        actorType: ctx.actorType,
        actorId: ctx.actorId,
      });
      return {
        ok: false,
        correlationId: decision.correlationId,
        code: "RECOMMEND_ONLY",
        message: "Tenant logistics policy permits recommendation only; execution is disabled.",
      };
    }

    const reasons = await this.approvalReasons(policy, input, provider.key);
    if (policy.autonomyMode === "approve_then_act") reasons.unshift("approve_then_act_policy");
    const approvalRequired = reasons.length > 0;

    if (approvalRequired && !options.approval?.approved) {
      await this.append(ctx, decision.correlationId, input, policy, {
        stage: "authorize",
        providerKey: provider.key,
        routingStrategy: policy.strategy,
        decisionScore: decision.route.candidate.intelligence?.score,
        approvalRequired: true,
        evidence: { authorized: false, reasons },
        actorType: ctx.actorType,
        actorId: ctx.actorId,
      });
      return {
        ok: false,
        correlationId: decision.correlationId,
        code: "APPROVAL_REQUIRED",
        message: "Human approval is required before this shipment can be executed.",
        approvalReasons: reasons,
      };
    }

    await this.append(ctx, decision.correlationId, input, policy, {
      stage: "authorize",
      providerKey: provider.key,
      routingStrategy: policy.strategy,
      decisionScore: decision.route.candidate.intelligence?.score,
      approvalRequired,
      evidence: {
        authorized: true,
        approvalReference: options.approval?.reference ?? null,
        approvedByActorId: options.approval?.approvedByActorId ?? null,
        reasons,
      },
      actorType: options.approval?.approved ? "user" : "rinads_intelligence",
      actorId: options.approval?.approvedByActorId ?? ctx.actorId,
    });

    try {
      const shipment = await provider.adapter.createShipment({
        orderId: input.orderId,
        packageId: input.packageId,
        weightGrams: input.weightGrams,
        destinationPincode: input.destinationPincode,
      });

      await this.append(ctx, decision.correlationId, input, policy, {
        stage: "act",
        providerKey: provider.key,
        routingStrategy: policy.strategy,
        decisionScore: decision.route.candidate.intelligence?.score,
        approvalRequired,
        evidence: {
          success: true,
          carrier: shipment.carrier,
          service: shipment.service ?? null,
        },
        actorType: "rinpo_runtime",
      });

      return {
        ok: true,
        correlationId: decision.correlationId,
        providerKey: provider.key,
        quote: decision.route.candidate.quote,
        shipment,
      };
    } catch (error) {
      await this.append(ctx, decision.correlationId, input, policy, {
        stage: "act",
        providerKey: provider.key,
        routingStrategy: policy.strategy,
        decisionScore: decision.route.candidate.intelligence?.score,
        approvalRequired,
        evidence: {
          success: false,
          error: error instanceof Error ? error.message : "Provider execution failed.",
        },
        actorType: "rinpo_runtime",
      });

      return {
        ok: false,
        correlationId: decision.correlationId,
        code: "PROVIDER_ERROR",
        message: error instanceof Error ? error.message : "Provider execution failed.",
      };
    }
  }
}
