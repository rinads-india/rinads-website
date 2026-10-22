import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MarketingPublicationDispatchError,
  runMarketingPublicationWorker,
  type ClaimedMarketingPublication,
  type MarketingPublicationFailure,
  type MarketingPublicationResult,
  type MarketingPublicationTransport,
  type MarketingPublicationWorkerRepository,
} from "../src/marketing/index";

function claim(overrides: Partial<ClaimedMarketingPublication> = {}): ClaimedMarketingPublication {
  return {
    publicationId: "pub-1",
    organizationId: "org-1",
    attemptId: "attempt-1",
    attemptNo: 1,
    provider: "meta",
    channelAccountId: "acct-1",
    approvalId: "approval-1",
    approvalStatus: "approved",
    idempotencyKey: "marketing.publication:pub-1",
    text: "Business Simplified.",
    mediaPaths: [],
    ...overrides,
  };
}

class FakeRepository implements MarketingPublicationWorkerRepository {
  claimCalls = 0;
  begin: ClaimedMarketingPublication[] = [];
  completed: Array<{ claim: ClaimedMarketingPublication; result: MarketingPublicationResult }> = [];
  failed: Array<{ claim: ClaimedMarketingPublication; failure: MarketingPublicationFailure }> = [];

  constructor(readonly claims: readonly ClaimedMarketingPublication[]) {}

  async claim(_limit: number) {
    this.claimCalls++;
    return this.claims;
  }

  async beginDispatch(value: ClaimedMarketingPublication) {
    this.begin.push(value);
  }

  async complete(value: ClaimedMarketingPublication, result: MarketingPublicationResult) {
    this.completed.push({ claim: value, result });
  }

  async fail(value: ClaimedMarketingPublication, failure: MarketingPublicationFailure) {
    this.failed.push({ claim: value, failure });
  }
}

function transport(
  publish: (value: ClaimedMarketingPublication) => Promise<MarketingPublicationResult>,
  validate?: (value: ClaimedMarketingPublication) => Promise<void>,
): MarketingPublicationTransport {
  return { provider: "meta", publish, validate };
}

describe("Marketing OS governed publication worker", () => {
  it("is fail-closed when external effects are disabled", async () => {
    const repository = new FakeRepository([claim()]);
    let providerCalls = 0;
    const result = await runMarketingPublicationWorker({
      externalEffectsEnabled: false,
      repository,
      transports: [transport(async () => {
        providerCalls++;
        return { externalPostId: "post-1" };
      })],
    });

    assert.equal(result.disabled, true);
    assert.equal(repository.claimCalls, 0);
    assert.equal(providerCalls, 0);
  });

  it("dispatches an approved claim exactly once and preserves the idempotency key", async () => {
    const item = claim();
    const repository = new FakeRepository([item]);
    const seenKeys: string[] = [];
    const result = await runMarketingPublicationWorker({
      externalEffectsEnabled: true,
      repository,
      transports: [transport(async (value) => {
        seenKeys.push(value.idempotencyKey);
        return { externalPostId: "post-1", externalUrl: "https://example.invalid/post-1" };
      })],
    });

    assert.deepEqual(seenKeys, ["marketing.publication:pub-1"]);
    assert.equal(repository.begin.length, 1);
    assert.equal(repository.completed.length, 1);
    assert.equal(repository.failed.length, 0);
    assert.equal(result.published, 1);
  });

  it("fails before dispatch when the provider transport is not registered", async () => {
    const repository = new FakeRepository([claim()]);
    const result = await runMarketingPublicationWorker({
      externalEffectsEnabled: true,
      repository,
      transports: [],
    });

    assert.equal(repository.begin.length, 0);
    assert.equal(repository.failed[0]?.failure.deliveryState, "not_sent");
    assert.equal(result.failedBeforeDispatch, 1);
  });

  it("defensively rejects a claim without approved Runtime authority", async () => {
    const repository = new FakeRepository([claim({ approvalStatus: "pending" })]);
    let providerCalls = 0;
    await runMarketingPublicationWorker({
      externalEffectsEnabled: true,
      repository,
      transports: [transport(async () => {
        providerCalls++;
        return { externalPostId: "post-1" };
      })],
    });

    assert.equal(providerCalls, 0);
    assert.equal(repository.begin.length, 0);
    assert.equal(repository.failed[0]?.failure.errorCode, "approval_not_approved");
  });

  it("records local validation failures as not_sent before the dispatch boundary", async () => {
    const repository = new FakeRepository([claim()]);
    let providerCalls = 0;
    const result = await runMarketingPublicationWorker({
      externalEffectsEnabled: true,
      repository,
      transports: [transport(
        async () => {
          providerCalls++;
          return { externalPostId: "post-1" };
        },
        async () => {
          throw new MarketingPublicationDispatchError(
            "provider payload validation rejected locally",
            "invalid_payload",
            "not_sent",
          );
        },
      )],
    });

    assert.equal(providerCalls, 0);
    assert.equal(repository.begin.length, 0);
    assert.equal(repository.failed[0]?.failure.deliveryState, "not_sent");
    assert.equal(result.failedBeforeDispatch, 1);
  });

  it("treats an ordinary error after beginDispatch as an ambiguous delivery and never retries it", async () => {
    const repository = new FakeRepository([claim()]);
    let providerCalls = 0;
    const result = await runMarketingPublicationWorker({
      externalEffectsEnabled: true,
      repository,
      transports: [transport(async () => {
        providerCalls++;
        throw new Error("connection reset after request write");
      })],
    });

    assert.equal(providerCalls, 1);
    assert.equal(repository.begin.length, 1);
    assert.equal(repository.completed.length, 0);
    assert.equal(repository.failed[0]?.failure.deliveryState, "unknown");
    assert.equal(result.reconciliationRequired, 1);
  });

  it("does not trust a transport not_sent assertion after beginDispatch", async () => {
    const repository = new FakeRepository([claim()]);
    const result = await runMarketingPublicationWorker({
      externalEffectsEnabled: true,
      repository,
      transports: [transport(async () => {
        throw new MarketingPublicationDispatchError(
          "adapter believes request was not sent",
          "socket_not_written",
          "not_sent",
        );
      })],
    });

    assert.equal(repository.begin.length, 1);
    assert.equal(repository.failed[0]?.failure.errorCode, "socket_not_written");
    assert.equal(repository.failed[0]?.failure.deliveryState, "unknown");
    assert.equal(result.failedBeforeDispatch, 0);
    assert.equal(result.reconciliationRequired, 1);
  });
});
