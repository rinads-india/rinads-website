import {
  ChannelGatewayError,
  assertOrganizationScope,
  type SocialChannelAdapter,
} from "./channel-gateway";
import { MetaGraphError, type MetaCredentialResolver, type MetaGraphClient } from "./meta-graph";
import type {
  ChannelAccountDiscoveryInput,
  ChannelAccountDiscoveryResult,
  ChannelAccountMetricsInput,
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
  PublishRequest,
  PublishResult,
  ReplyRequest,
  ReplyResult,
  ScheduleRequest,
  ScheduledResult,
} from "./types";

export type MetaChannelAdapterDependencies = {
  graph?: MetaGraphClient;
  credentials?: MetaCredentialResolver;
};

/**
 * Marketing OS Meta adapter.
 *
 * Phase 0.1 enables only read-side capabilities: OAuth authorization URL creation,
 * account discovery, account-level profile metrics, and live credential health checks.
 * Every external mutation remains fail-closed until Runtime approval/publishing wiring is reviewed.
 */
export class MetaChannelAdapter implements SocialChannelAdapter {
  readonly provider = "meta" as const;
  readonly capabilities: ReadonlySet<ChannelCapability>;

  constructor(private readonly dependencies: MetaChannelAdapterDependencies = {}) {
    const capabilities: ChannelCapability[] = ["health_check"];
    if (dependencies.graph) capabilities.push("connect");
    if (dependencies.graph && dependencies.credentials) {
      capabilities.push("discover_accounts", "read_account_metrics");
    }
    this.capabilities = new Set(capabilities);
  }

  async healthCheck(input: ChannelHealthInput): Promise<ChannelHealthResult> {
    const connection = input.connection;
    if (connection.provider !== this.provider) {
      return {
        provider: this.provider,
        status: "unconfigured",
        message: "Connection provider does not match the Meta adapter.",
        checkedAt: new Date().toISOString(),
      };
    }
    if (connection.status === "revoked") {
      return {
        provider: this.provider,
        status: "revoked",
        message: "Meta connection is revoked and requires re-authorization.",
        checkedAt: new Date().toISOString(),
      };
    }
    if (!connection.credentialRef) {
      return {
        provider: this.provider,
        status: "unconfigured",
        message: "Meta credential reference is not configured.",
        checkedAt: new Date().toISOString(),
      };
    }

    const { graph, credentials } = this.dependencies;
    if (!graph || !credentials) {
      return {
        provider: this.provider,
        status: "degraded",
        message: "Meta credential metadata exists, but live verification dependencies are not configured.",
        checkedAt: new Date().toISOString(),
      };
    }

    try {
      const credential = await credentials.resolve({
        organizationId: connection.organizationId,
        connectionId: connection.id,
        credentialRef: connection.credentialRef,
      });
      await graph.verifyCredential(credential.accessToken);
      return {
        provider: this.provider,
        status: "healthy",
        message: "Meta credential verified with the pinned Graph API transport.",
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        provider: this.provider,
        status: error instanceof MetaGraphError && error.code === "PROVIDER_REJECTED" ? "revoked" : "degraded",
        message: "Meta credential verification failed; re-authorization or operator review is required.",
        checkedAt: new Date().toISOString(),
      };
    }
  }

  async connect(input: ChannelConnectInput): Promise<ChannelConnectResult> {
    if (!this.dependencies.graph) return this.block("connect");
    return this.dependencies.graph.authorization(input);
  }

  refreshCredentials(
    _input: ChannelCredentialRefreshInput,
  ): Promise<ChannelCredentialRefreshResult> {
    return this.block("refresh_credentials");
  }

  async discoverAccounts(
    input: ChannelAccountDiscoveryInput,
  ): Promise<ChannelAccountDiscoveryResult> {
    const { graph, credentials } = this.dependencies;
    if (!graph || !credentials) return this.block("discover_accounts");
    assertOrganizationScope(input.organizationId, input.connection.organizationId);
    if (input.connection.provider !== this.provider || !input.connection.credentialRef) {
      return this.block("discover_accounts");
    }
    const credential = await credentials.resolve({
      organizationId: input.organizationId,
      connectionId: input.connection.id,
      credentialRef: input.connection.credentialRef,
    });
    return {
      accounts: await graph.discoverAccounts(credential.accessToken),
      observedAt: new Date().toISOString(),
    };
  }

  publish(_input: PublishRequest): Promise<PublishResult> {
    return this.block("publish");
  }

  schedule(_input: ScheduleRequest): Promise<ScheduledResult> {
    return this.block("schedule");
  }

  deletePost(_input: ChannelPostLookup): Promise<DeletePostResult> {
    return this.block("delete_post");
  }

  getPost(_input: ChannelPostLookup): Promise<ChannelPost> {
    return this.block("read_post");
  }

  getMetrics(_input: ChannelPostLookup): Promise<ChannelMetricsResult> {
    return this.block("read_metrics");
  }

  async getAccountMetrics(input: ChannelAccountMetricsInput): Promise<ChannelMetricsResult> {
    const { graph, credentials } = this.dependencies;
    if (!graph || !credentials) return this.block("read_account_metrics");
    assertOrganizationScope(input.organizationId, input.connection.organizationId);
    assertOrganizationScope(input.organizationId, input.account.organizationId);
    if (
      input.connection.provider !== this.provider ||
      input.account.provider !== this.provider ||
      input.account.connectionId !== input.connection.id ||
      !input.connection.credentialRef
    ) {
      return this.block("read_account_metrics");
    }
    const credential = await credentials.resolve({
      organizationId: input.organizationId,
      connectionId: input.connection.id,
      credentialRef: input.connection.credentialRef,
    });
    return graph.getAccountMetrics(credential.accessToken, input.account);
  }

  getComments(_input: ChannelPostLookup): Promise<readonly ChannelComment[]> {
    return this.block("read_comments");
  }

  reply(_input: ReplyRequest): Promise<ReplyResult> {
    return this.block("reply");
  }

  private block<T>(capability: ChannelCapability): Promise<T> {
    return Promise.reject(
      new ChannelGatewayError(
        `Meta ${capability} is not enabled. Marketing OS Phase 0.1 is read-only and external mutations remain fail-closed.`,
        "INTEGRATION_NOT_CONFIGURED",
      ),
    );
  }
}
