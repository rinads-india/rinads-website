import type {
  ChannelCapability,
  ChannelComment,
  ChannelConnectInput,
  ChannelConnectResult,
  ChannelCredentialRefreshInput,
  ChannelCredentialRefreshResult,
  ChannelHealthInput,
  ChannelHealthResult,
  ChannelMetricsResult,
  ChannelPost,
  ChannelPostLookup,
  DeletePostResult,
  MarketingProvider,
  PublishRequest,
  PublishResult,
  ReplyRequest,
  ReplyResult,
  ScheduleRequest,
  ScheduledResult,
} from "./types";

export class ChannelGatewayError extends Error {
  constructor(
    message: string,
    readonly code:
      | "ADAPTER_NOT_REGISTERED"
      | "CAPABILITY_NOT_SUPPORTED"
      | "INTEGRATION_NOT_CONFIGURED"
      | "INVALID_TENANT_CONTEXT",
  ) {
    super(message);
    this.name = "ChannelGatewayError";
  }
}

export interface SocialChannelAdapter {
  readonly provider: MarketingProvider;
  readonly capabilities: ReadonlySet<ChannelCapability>;

  connect(input: ChannelConnectInput): Promise<ChannelConnectResult>;
  refreshCredentials(
    input: ChannelCredentialRefreshInput,
  ): Promise<ChannelCredentialRefreshResult>;
  publish(input: PublishRequest): Promise<PublishResult>;
  schedule(input: ScheduleRequest): Promise<ScheduledResult>;
  deletePost(input: ChannelPostLookup): Promise<DeletePostResult>;
  getPost(input: ChannelPostLookup): Promise<ChannelPost>;
  getMetrics(input: ChannelPostLookup): Promise<ChannelMetricsResult>;
  getAccountMetrics(input: {
    organizationId: string;
    accountId: string;
  }): Promise<ChannelMetricsResult>;
  getComments(input: ChannelPostLookup): Promise<readonly ChannelComment[]>;
  reply(input: ReplyRequest): Promise<ReplyResult>;
  healthCheck(input: ChannelHealthInput): Promise<ChannelHealthResult>;
}

export class ChannelGateway {
  private readonly adapters = new Map<MarketingProvider, SocialChannelAdapter>();

  register(adapter: SocialChannelAdapter): this {
    this.adapters.set(adapter.provider, adapter);
    return this;
  }

  has(provider: MarketingProvider): boolean {
    return this.adapters.has(provider);
  }

  get(provider: MarketingProvider): SocialChannelAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new ChannelGatewayError(
        `No channel adapter registered for ${provider}`,
        "ADAPTER_NOT_REGISTERED",
      );
    }
    return adapter;
  }

  requireCapability(
    provider: MarketingProvider,
    capability: ChannelCapability,
  ): SocialChannelAdapter {
    const adapter = this.get(provider);
    if (!adapter.capabilities.has(capability)) {
      throw new ChannelGatewayError(
        `${provider} adapter does not support ${capability}`,
        "CAPABILITY_NOT_SUPPORTED",
      );
    }
    return adapter;
  }
}

export function assertOrganizationScope(
  expectedOrganizationId: string,
  actualOrganizationId: string,
): void {
  if (!expectedOrganizationId || expectedOrganizationId !== actualOrganizationId) {
    throw new ChannelGatewayError(
      "Channel action organization does not match the active tenant",
      "INVALID_TENANT_CONTEXT",
    );
  }
}
