import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RinpoModelClient } from "../src/model-client";

describe("RINPO model client", () => {
  it("uses Anthropic Messages without exposing the key in the URL", async () => {
    let url = "";
    let headers: Headers | undefined;
    let body = "";
    const client = new RinpoModelClient(
      {
        provider: "anthropic",
        apiKey: "anthropic-secret",
        baseUrl: "https://api.anthropic.com/v1",
        model: "claude-sonnet-5-5",
        configured: true,
      },
      (async (input, init) => {
        url = String(input);
        headers = new Headers(init?.headers);
        body = String(init?.body ?? "");
        return new Response(
          JSON.stringify({ content: [{ type: "text", text: '{"kind":"clarify","question":"ok"}' }] }),
          { status: 200 }
        );
      }) as typeof fetch
    );

    const result = await client.generateJsonText({ system: "System", user: { hello: "world" } });

    assert.equal(url, "https://api.anthropic.com/v1/messages");
    assert.equal(url.includes("anthropic-secret"), false);
    assert.equal(headers?.get("x-api-key"), "anthropic-secret");
    assert.equal(headers?.get("anthropic-version"), "2023-06-01");
    assert.match(body, /claude-sonnet-5-5/);
    assert.equal(result, '{"kind":"clarify","question":"ok"}');
  });

  it("uses Google API-key headers rather than query-string credentials", async () => {
    let url = "";
    let headers: Headers | undefined;
    let body = "";
    const client = new RinpoModelClient(
      {
        provider: "google",
        apiKey: "google-secret",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
        model: "gemini-3.8-flash",
        configured: true,
      },
      (async (input, init) => {
        url = String(input);
        headers = new Headers(init?.headers);
        body = String(init?.body ?? "");
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: '{"kind":"clarify","question":"ok"}' }] } }],
          }),
          { status: 200 }
        );
      }) as typeof fetch
    );

    const result = await client.generateJsonText({ system: "System", user: { hello: "world" } });

    assert.equal(
      url,
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent"
    );
    assert.equal(url.includes("google-secret"), false);
    assert.equal(headers?.get("x-goog-api-key"), "google-secret");
    assert.match(body, /application\/json/);
    assert.equal(result, '{"kind":"clarify","question":"ok"}');
  });
});
