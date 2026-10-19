import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), "utf8");
}

describe("RINPO Phone M2 web-app contracts", () => {
  it("exposes a dedicated standalone /phone entry point", () => {
    const page = read("../app/phone/page.tsx");
    const client = read("../app/phone/PhoneAppClient.tsx");

    assert.match(page, /manifest: "\/phone\/manifest\.webmanifest"/);
    assert.match(page, /robots:[\s\S]*index: false/);
    assert.match(client, /RINPO Phone · installable web experience/);
    assert.match(client, /does not replace iOS, Android, macOS or Windows/i);
  });

  it("scopes the manifest to the phone surface", () => {
    const manifest = read("../app/phone/manifest.webmanifest/route.ts");

    assert.match(manifest, /id: "\/phone"/);
    assert.match(manifest, /scope: "\/phone"/);
    assert.match(manifest, /display: "standalone"/);
    assert.match(manifest, /screen=today/);
    assert.match(manifest, /screen=world/);
  });

  it("keeps the service worker network-only for authenticated safety", () => {
    const worker = read("../public/rinpo-phone-sw.js");

    assert.match(worker, /offline business data is not a product claim/i);
    assert.match(worker, /url\.pathname\.startsWith\("\/api\/"\)/);
    assert.match(worker, /event\.respondWith\(fetch\(request\)\)/);
    assert.doesNotMatch(worker, /caches\.open/);
    assert.doesNotMatch(worker, /cache\.put/);
  });

  it("registers the service worker only as progressive enhancement", () => {
    const client = read("../app/phone/PhoneAppClient.tsx");

    assert.match(client, /navigator\.serviceWorker\.register\("\/rinpo-phone-sw\.js", \{ scope: "\/phone" \}\)/);
    assert.match(client, /progressive enhancement/i);
    assert.match(client, /Sensitive business actions remain governed/i);
  });
});
