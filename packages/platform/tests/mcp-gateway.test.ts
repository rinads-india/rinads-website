import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  capabilityKeyToMcpToolName,
  handleRinadsMcpRequest,
  listRinadsMcpTools,
  RINADS_MCP_LEGACY_PROTOCOL_VERSION,
  RINADS_MCP_MODERN_PROTOCOL_VERSION,
} from "../src/mcp-gateway";

describe("RINADS MCP gateway", () => {
  it("advertises the modern stateless protocol through server/discover", () => {
    const handled = handleRinadsMcpRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "server/discover",
      params: {
        _meta: {
          "io.modelcontextprotocol/protocolVersion": RINADS_MCP_MODERN_PROTOCOL_VERSION,
          "io.modelcontextprotocol/clientInfo": { name: "test", version: "1" },
          "io.modelcontextprotocol/clientCapabilities": {},
        },
      },
    });

    assert.equal(handled.kind, "response");
    if (handled.kind !== "response" || !("result" in handled.body)) return;
    const result = handled.body.result as Record<string, unknown>;
    assert.deepEqual(result.supportedVersions, [
      RINADS_MCP_MODERN_PROTOCOL_VERSION,
      RINADS_MCP_LEGACY_PROTOCOL_VERSION,
    ]);
    assert.deepEqual(result.capabilities, { tools: { listChanged: false } });
    assert.equal(result.ttlMs, 300000);
    assert.equal(result.cacheScope, "public");
  });

  it("supports the legacy initialize discovery path without creating authorization state", () => {
    const handled = handleRinadsMcpRequest({
      jsonrpc: "2.0",
      id: "legacy-1",
      method: "initialize",
      params: {
        protocolVersion: RINADS_MCP_LEGACY_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "legacy-client", version: "1" },
      },
    });

    assert.equal(handled.kind, "response");
    if (handled.kind !== "response" || !("result" in handled.body)) return;
    const result = handled.body.result as Record<string, unknown>;
    assert.equal(result.protocolVersion, RINADS_MCP_LEGACY_PROTOCOL_VERSION);
    assert.equal(typeof result.serverInfo, "object");
  });

  it("lists canonical tools without exposing organization_id as an argument", () => {
    const tools = listRinadsMcpTools();
    assert.ok(tools.length >= 10);
    assert.ok(tools.some((tool) => tool.name === capabilityKeyToMcpToolName("logistics.quote.read")));

    const serializedInputSchemas = JSON.stringify(tools.map((tool) => tool.inputSchema));
    assert.equal(serializedInputSchemas.includes("organization_id"), false);
    assert.equal(tools.every((tool) => tool._meta["com.rinads/executionEnabled"] === false), true);
  });

  it("marks read tools as read-only and sensitive tools as destructive", () => {
    const tools = listRinadsMcpTools();
    const summary = tools.find(
      (tool) => tool.name === capabilityKeyToMcpToolName("intelligence.business_summary.read")
    );
    const cancel = tools.find(
      (tool) => tool.name === capabilityKeyToMcpToolName("logistics.shipment.cancel")
    );

    assert.equal(summary?.annotations.readOnlyHint, true);
    assert.equal(summary?.annotations.destructiveHint, false);
    assert.equal(cancel?.annotations.readOnlyHint, false);
    assert.equal(cancel?.annotations.destructiveHint, true);
  });

  it("requires agent authentication before tool execution", () => {
    const handled = handleRinadsMcpRequest({
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: capabilityKeyToMcpToolName("logistics.quote.read"),
        arguments: {
          origin_pincode: "680651",
          destination_pincode: "682016",
          chargeable_weight_grams: 500,
        },
      },
    });

    assert.equal(handled.kind, "response");
    if (handled.kind !== "response" || !("result" in handled.body)) return;
    const result = handled.body.result as {
      isError?: boolean;
      _meta?: Record<string, unknown>;
      content?: Array<{ text?: string }>;
    };
    assert.equal(result.isError, true);
    assert.equal(result._meta?.["com.rinads/authenticated"], false);
    assert.equal(result._meta?.["com.rinads/executionEnabled"], false);
    assert.equal(result._meta?.["com.rinads/reason"], "AGENT_AUTH_REQUIRED");
  });

  it("fails closed when an authenticated identity has ambiguous organization scope", () => {
    const handled = handleRinadsMcpRequest(
      {
        jsonrpc: "2.0",
        id: 10,
        method: "tools/call",
        params: {
          name: capabilityKeyToMcpToolName("logistics.shipment.track"),
          arguments: { awb: "123456" },
        },
      },
      { principalStatus: "scope_required" }
    );

    assert.equal(handled.kind, "response");
    if (handled.kind !== "response" || !("result" in handled.body)) return;
    const result = handled.body.result as {
      isError?: boolean;
      _meta?: Record<string, unknown>;
      content?: Array<{ text?: string }>;
    };
    assert.equal(result.isError, true);
    assert.equal(result._meta?.["com.rinads/reason"], "AGENT_ORGANIZATION_SCOPE_REQUIRED");
    assert.match(result.content?.[0]?.text ?? "", /will not accept an organization_id/);
  });

  it("keeps capability execution disabled even after principal and tenant scope resolve", () => {
    const handled = handleRinadsMcpRequest(
      {
        jsonrpc: "2.0",
        id: 11,
        method: "tools/call",
        params: {
          name: capabilityKeyToMcpToolName("intelligence.business_summary.read"),
          arguments: { period: "7d" },
        },
      },
      {
        principal: {
          actorId: "user_1",
          organizationId: "org_1",
          roleKey: "founder",
          permissionIds: ["org.read"],
          authMethod: "bearer",
        },
      }
    );

    assert.equal(handled.kind, "response");
    if (handled.kind !== "response" || !("result" in handled.body)) return;
    const result = handled.body.result as {
      isError?: boolean;
      _meta?: Record<string, unknown>;
    };
    assert.equal(result.isError, true);
    assert.equal(result._meta?.["com.rinads/authenticated"], true);
    assert.equal(result._meta?.["com.rinads/executionEnabled"], false);
    assert.equal(result._meta?.["com.rinads/reason"], "CAPABILITY_EXECUTION_NOT_ENABLED");
  });

  it("rejects unknown tools and invalid requests", () => {
    const unknown = handleRinadsMcpRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "rinads.unknown", arguments: {} },
    });
    assert.equal(unknown.kind, "response");
    if (unknown.kind === "response") {
      assert.ok("error" in unknown.body);
      if ("error" in unknown.body) assert.equal(unknown.body.error.code, -32602);
    }

    const invalid = handleRinadsMcpRequest({ hello: "world" });
    assert.equal(invalid.kind, "response");
    if (invalid.kind === "response") {
      assert.equal(invalid.status, 400);
      assert.ok("error" in invalid.body);
      if ("error" in invalid.body) assert.equal(invalid.body.error.code, -32600);
    }
  });
});
