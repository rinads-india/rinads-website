import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

async function read(relativePath: string) {
  return readFile(new URL(relativePath, import.meta.url), "utf8");
}

test("/start exposes the founder-approved conversion paths", async () => {
  const startClient = await read("../app/start/StartClient.tsx");

  assert.match(startClient, /Book a 30-minute demo/);
  assert.match(startClient, /Free Business Simplified Audit/);
  assert.match(startClient, /Talk to RINPO/);
  assert.match(startClient, /Explore industry solutions/);
  assert.match(startClient, /Learn with RINADS Academy/);
  assert.match(startClient, /Partner with RINADS/);
  assert.match(startClient, /intent=audit/);
  assert.match(startClient, /intent=demo/);
  assert.match(startClient, /source.*start/);
});

test("contact flow recognizes start attribution, audit, and partner intents", async () => {
  const contactClient = await read("../app/contact/ContactClient.tsx");
  const contactPage = await read("../app/contact/page.tsx");

  assert.match(contactClient, /source === "start"/);
  assert.match(contactClient, /intent === "audit"/);
  assert.match(contactClient, /Request your free Business Simplified Audit/);
  assert.match(contactClient, /intent === "partner"/);

  assert.match(contactPage, /intent === "audit"/);
  assert.match(contactPage, /current setup, digital presence and operating gaps/);
  assert.match(contactPage, /No promised outcomes or invented scores/);
  assert.match(contactPage, /intent === "partner"/);
});
