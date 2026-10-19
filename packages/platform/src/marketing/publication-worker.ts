import type { MarketingProvider } from "./types";

export type PublicationDeliveryState = "not_sent" | "unknown";

export type ClaimedMarketingPublication = {
  publicationId: string;
  organizationId: string;
  attemptId: string;
  attemptNo: number;
  provider: MarketingProvider;
  channelAccountId: string;
  approvalId: string;
  approvalStatus: "approved" | string;
  idempotencyKey: string;
  text?: string;
  mediaPaths?: readonly string[];
};

export type MarketingPublicationResult = {
  externalPostId: string;
  externalUrl?: string | null;
  providerResponse?: Readonly<Record<string, unknown>>;
};

export type MarketingPublicationFailure = {
  errorCode: string;
  errorMessage: string;
  deliveryState: PublicationDeliveryState;
};

export interface MarketingPublicationWorkerRepository {
  claim(limit: number): Promise<readonly ClaimedMarketingPublication[]>;
  beginDispatch(claim: ClaimedMarketingPublication): Promise<void>;
  complete(
    claim: ClaimedMarketingPublication,
    result: MarketingPublicationResult,
  ): Promise<void>;
  fail(
    claim: ClaimedMarketingPublication,
    failure: MarketingPublicationFailure,
  ): Promise<void>;
}

export interface MarketingPublicationTransport {
  readonly provider: MarketingProvider;
  publish(claim: ClaimedMarketingPublication): Promise<MarketingPublicationResult>;
}

/**
 * Transport errors may explicitly prove that no provider request was sent.
 * Any ordinary/ambiguous exception after beginDispatch is treated as `unknown`
 * and MUST NOT be automatically retried, because the provider may already have
 * accepted the post.
 */
export class MarketingPublicationDispatchError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly deliveryState: PublicationDeliveryState,
  ) {
    super(message);
    this.name = "MarketingPublicationDispatchError";
  }
}

export type MarketingPublicationWorkerResult = {
  disabled: boolean;
  claimed: number;
  published: number;
  failedBeforeDispatch: number;
  reconciliationRequired: number;
};

export async function runMarketingPublicationWorker(input: {
  externalEffectsEnabled: boolean;
  repository: MarketingPublicationWorkerRepository;
  transports: readonly MarketingPublicationTransport[];
  limit?: number;
}): Promise<MarketingPublicationWorkerResult> {
  if (!input.externalEffectsEnabled) {
    return {
      disabled: true,
      claimed: 0,
      published: 0,
      failedBeforeDispatch: 0,
      reconciliationRequired: 0,
    };
  }

  const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
  const claims = await input.repository.claim(limit);
  const transports = new Map(input.transports.map((transport) => [transport.provider, transport]));

  let published = 0;
  let failedBeforeDispatch = 0;
  let reconciliationRequired = 0;

  for (const claim of claims) {
    if (claim.approvalStatus !== "approved") {
      await input.repository.fail(claim, {
        errorCode: "approval_not_approved",
        errorMessage: "Publication claim does not carry an approved Runtime approval",
        deliveryState: "not_sent",
      });
      failedBeforeDispatch++;
      continue;
    }

    const transport = transports.get(claim.provider);
    if (!transport) {
      await input.repository.fail(claim, {
        errorCode: "transport_not_registered",
        errorMessage: `No publication transport is registered for ${claim.provider}`,
        deliveryState: "not_sent",
      });
      failedBeforeDispatch++;
      continue;
    }

    // This persistence boundary is deliberately immediately before the external
    // transport. A crash or ordinary exception after it is an ambiguous outcome.
    await input.repository.beginDispatch(claim);

    try {
      const result = await transport.publish(claim);
      if (!result.externalPostId?.trim()) {
        throw new MarketingPublicationDispatchError(
          "Provider did not return an external post id",
          "missing_external_post_id",
          "unknown",
        );
      }
      await input.repository.complete(claim, result);
      published++;
    } catch (error) {
      const failure: MarketingPublicationFailure =
        error instanceof MarketingPublicationDispatchError
          ? {
              errorCode: error.code,
              errorMessage: error.message,
              deliveryState: error.deliveryState,
            }
          : {
              errorCode: "ambiguous_provider_failure",
              errorMessage: error instanceof Error ? error.message : "Unknown provider error",
              deliveryState: "unknown",
            };

      await input.repository.fail(claim, failure);
      if (failure.deliveryState === "unknown") reconciliationRequired++;
      else failedBeforeDispatch++;
    }
  }

  return {
    disabled: false,
    claimed: claims.length,
    published,
    failedBeforeDispatch,
    reconciliationRequired,
  };
}
