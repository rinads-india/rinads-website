import {
  ChannelGatewayError,
  type SocialChannelAdapter,
} from "./channel-gateway";
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
  PublishRequest,
  PublishResult,
  ReplyRequest,
  ReplyResult,
  ScheduleRequest,
  ScheduledResult,
} from "./types";

const PHASE0_CAPABILITIES = new Set<ChannelCapability>(["health_check"]);

/**
 * Phase 0 Meta adapter boundary.
 *
 * It deliberately does not call Meta Graph APIs yet. OAuth credentials belong in a
 * server-side secret store and the database stores only `credential_ref` handles.
 * Mutating capabilities stay fail-closed until the reviewed transport is wired.
 */
export class MetaChannelAdapter implements SocialChannelAdapter {
  readonly provider = "meta" as const;
  readonly capabilities: ReadonlySet<ChannelCapability> = PHASE0_CAPABILITIES;

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

    return {
      provider: this.provider,
      status: connection.status === "degraded" ? "degraded" : "healthy",
      message:
        "Meta connection metadata is configured. Live Graph API verification is intentionally disabled in Phase 0.",
      checkedAt: new Date().toISOString(),
    };
  }

  connect(_input: ChannelConnectInput): Promise<ChannelConnectResult> {
    return this.block("connect");
  }

  refreshCredentials(
    _input: ChannelCredentialRefreshInput,
  ): Promise<ChannelCredentialRefreshResult> {
    return this.block("refresh_credentials");
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

  getAccountMetrics(_input: {
    organizationId: string;
    accountId: string;
  }): Promise<ChannelMetricsResult> {
    return this.block("read_account_metrics");
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
        `Meta ${capability} is not wired in Phase 0. Configure reviewed OAuth/Graph transport before enabling external effects.`,
        "INTEGRATION_NOT_CONFIGURED",
      ),
    );
  }
}
