/**
 * RINPO Live — Runway Character management.
 *
 *   pnpm --filter @rinads/website runway:sync [options]
 *   pnpm --filter @rinads/website runway:transcripts [options]
 *
 * `sync` creates (or updates) the RINPO Character, publishes the knowledge
 * documents and links them to the avatar. It is idempotent: documents are
 * matched by name, and the avatar is updated in place when RUNWAY_AVATAR_ID is
 * set. `transcripts` exports recent conversations so corrections can be added
 * to content/rinpo-knowledge/corrections.md (that is the "training" loop —
 * Runway Characters are not fine-tuned).
 *
 * Requires RUNWAYML_API_SECRET (not needed for --dry-run).
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import RunwayML from "@runwayml/sdk";
import type { AvatarCreateParams } from "@runwayml/sdk/resources/avatars";
import {
  KNOWLEDGE_TOKEN_LIMIT,
  buildKnowledgeDocuments,
  estimateTokens,
  totalKnowledgeTokens,
  type KnowledgeDocument,
} from "../../lib/rinpo-live/knowledge";
import { LIVE_LANGUAGES } from "../../lib/rinpo-live/languages";
import { buildPersonality, buildStartScript } from "../../lib/rinpo-live/personality";
import { duplicateAvatarMessage, findDuplicateAvatar } from "../../lib/rinpo-live/sync-guards";

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = join(HERE, "assets");
const KNOWLEDGE_DIR = join(HERE, "..", "..", "content", "rinpo-knowledge");
const REFERENCE_IMAGE = join(ASSETS, "rinpo-reference.png");
const VOICE_SAMPLE = join(ASSETS, "rinpo-voice-sample.mp3");

const HELP = `
RINPO Live — Runway Character tooling

  sync          Create/update the Character and publish knowledge documents
  transcripts   Export recent conversations for the review loop

sync options
  --dry-run             Build everything, print sizes, call no API
  --export <dir>        Also write the knowledge documents to <dir> for review
  --name <name>         Character name (default: RINPO)
  --voice-preset <id>   Runway preset voice (default: clara)
  --clone-voice         Clone a custom voice from scripts/runway/assets/rinpo-voice-sample.mp3
  --voice-id <id>       Use an existing custom voice
  --update-image        Re-upload the reference image on an existing Character
  --force-create        Create a new Character even if one with the same name exists

transcripts options
  --limit <n>           How many recent conversations (default: 20)
  --out <file>          Write markdown here instead of stdout (do not commit it)
`;

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function dataUri(file: string, mime: string): string {
  return `data:${mime};base64,${readFileSync(file).toString("base64")}`;
}

function titleFromFilename(file: string): string {
  const words = file.replace(/\.md$/, "").replace(/[-_]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Hand-written documents from content/rinpo-knowledge/*.md. */
function readAuthoredDocuments(): KnowledgeDocument[] {
  const names: Record<string, string> = {
    "faq.md": "RINPO Live — FAQ",
    "corrections.md": "RINPO Live — corrections and training notes",
  };
  return readdirSync(KNOWLEDGE_DIR)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => ({
      key: file.replace(/\.md$/, ""),
      name: names[file] ?? `RINPO Live — ${titleFromFilename(file)}`,
      content: readFileSync(join(KNOWLEDGE_DIR, file), "utf8"),
    }));
}

function assertEnvSecret(): string {
  const secret = process.env.RUNWAYML_API_SECRET?.trim();
  if (!secret) fail("RUNWAYML_API_SECRET is not set. Create a key at https://dev.runway.com/settings/api-keys");
  return secret;
}

function reportKnowledge(documents: KnowledgeDocument[]): void {
  console.log("\nKnowledge documents");
  for (const doc of documents) {
    console.log(`  • ${doc.name}  (~${estimateTokens(doc.content).toLocaleString()} tokens)`);
  }
  const total = totalKnowledgeTokens(documents);
  console.log(`  Total ≈ ${total.toLocaleString()} / ${KNOWLEDGE_TOKEN_LIMIT.toLocaleString()} tokens`);
  if (total > KNOWLEDGE_TOKEN_LIMIT) {
    fail("Knowledge exceeds Runway's 50,000-token limit per avatar. Trim content/rinpo-knowledge or the catalogs.");
  }
  if (total > KNOWLEDGE_TOKEN_LIMIT * 0.8) {
    console.warn("  ⚠ Over 80% of the knowledge budget — leave headroom for corrections.");
  }
}

function reportPrompts(): void {
  console.log("\nPer-language prompts (rebuilt on every session)");
  for (const language of LIVE_LANGUAGES) {
    const personality = buildPersonality(language.code);
    const startScript = buildStartScript(language.code);
    console.log(
      `  • ${language.label.padEnd(11)} personality ${personality.length} / 10000 chars · start script ${startScript.length} / 2000 chars`,
    );
  }
}

async function waitUntil<T extends { status: string }>(
  label: string,
  poll: () => Promise<T>,
  timeoutMs = 120_000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const current = await poll();
    if (current.status === "READY") return current;
    if (current.status === "FAILED") fail(`${label} failed: ${JSON.stringify(current)}`);
    if (Date.now() > deadline) fail(`${label} did not become READY within ${timeoutMs / 1000}s.`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

async function resolveVoice(
  client: RunwayML,
  values: { "clone-voice"?: boolean; "voice-id"?: string; "voice-preset"?: string },
): Promise<AvatarCreateParams["voice"]> {
  if (values["voice-id"]) return { type: "custom", id: values["voice-id"] };
  if (values["clone-voice"]) {
    console.log("\nCloning voice from the sample extracted from the character video…");
    const voice = await client.voices.create({
      name: "RINPO",
      description: "Cloned from the RINPO character video.",
      from: { type: "audio", audio: dataUri(VOICE_SAMPLE, "audio/mpeg") },
    });
    await waitUntil("Voice", () => client.voices.retrieve(voice.id));
    console.log(`  ✔ Custom voice ready: ${voice.id}`);
    return { type: "custom", id: voice.id };
  }
  return {
    type: "runway-live-preset",
    presetId: (values["voice-preset"] ?? "clara") as Extract<
      AvatarCreateParams["voice"],
      { type: "runway-live-preset" }
    >["presetId"],
  };
}

async function syncDocuments(client: RunwayML, documents: KnowledgeDocument[]): Promise<string[]> {
  const existing = new Map<string, string>();
  for await (const doc of client.documents.list({ limit: 100, order: "asc", sort: "createdAt" })) {
    existing.set(doc.name, doc.id);
  }
  const ids: string[] = [];
  for (const doc of documents) {
    const id = existing.get(doc.name);
    if (id) {
      await client.documents.update(id, { content: doc.content });
      console.log(`  ↻ updated  ${doc.name}`);
      ids.push(id);
    } else {
      const created = await client.documents.create({ name: doc.name, content: doc.content });
      console.log(`  + created  ${doc.name}`);
      ids.push(created.id);
    }
  }
  return ids;
}

async function sync(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      "dry-run": { type: "boolean" },
      export: { type: "string" },
      name: { type: "string" },
      "voice-preset": { type: "string" },
      "clone-voice": { type: "boolean" },
      "voice-id": { type: "string" },
      "update-image": { type: "boolean" },
      "force-create": { type: "boolean" },
    },
  });

  const documents = buildKnowledgeDocuments(readAuthoredDocuments());
  reportKnowledge(documents);
  reportPrompts();

  if (values.export) {
    mkdirSync(values.export, { recursive: true });
    for (const doc of documents) {
      writeFileSync(join(values.export, `${doc.key}.md`), `${doc.content}\n`);
    }
    console.log(`\nWrote ${documents.length} documents to ${values.export}`);
  }

  if (values["dry-run"]) {
    console.log("\nDry run — no API calls were made.");
    return;
  }

  const client = new RunwayML({ apiKey: assertEnvSecret() });
  const name = values.name ?? "RINPO";

  console.log("\nPublishing knowledge");
  const documentIds = await syncDocuments(client, documents);

  const avatarId = process.env.RUNWAY_AVATAR_ID?.trim();
  const personality = buildPersonality("auto");
  const startScript = buildStartScript("auto");

  if (avatarId) {
    console.log(`\nUpdating Character ${avatarId}`);
    const voiceRequested = values["clone-voice"] || values["voice-id"] || values["voice-preset"];
    await client.avatars.update(avatarId, {
      name,
      personality,
      startScript,
      documentIds,
      ...(voiceRequested ? { voice: await resolveVoice(client, values) } : {}),
      ...(values["update-image"]
        ? { referenceImage: dataUri(REFERENCE_IMAGE, "image/png"), imageProcessing: "optimize" as const }
        : {}),
    });
    console.log("  ✔ Character updated. Knowledge and prompts are live for new sessions.");
    return;
  }

  if (!values["force-create"]) {
    const existing: { id: string; name: string }[] = [];
    for await (const avatar of client.avatars.list({ limit: 100 })) {
      existing.push({ id: avatar.id, name: avatar.name });
    }
    const duplicate = findDuplicateAvatar(existing, name);
    if (duplicate) fail(duplicateAvatarMessage(duplicate, name));
  }

  console.log("\nCreating Character from the reference frame");
  const created = await client.avatars.create({
    name,
    personality,
    startScript,
    documentIds,
    referenceImage: dataUri(REFERENCE_IMAGE, "image/png"),
    imageProcessing: "optimize",
    voice: await resolveVoice(client, values),
  });
  await waitUntil("Character", () => client.avatars.retrieve(created.id));

  console.log(`\n✔ Character ready.\n`);
  console.log(`  Add this to your environment (Vercel Production + .env.local):`);
  console.log(`  RUNWAY_AVATAR_ID=${created.id}`);
  console.log(`  RUNWAYML_API_SECRET=<your Runway API key>\n`);
}

async function transcripts(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: { limit: { type: "string" }, out: { type: "string" } },
  });
  const avatarId = process.env.RUNWAY_AVATAR_ID?.trim();
  if (!avatarId) fail("RUNWAY_AVATAR_ID is not set — run `runway:sync` first.");
  const limit = Math.max(1, Number.parseInt(values.limit ?? "20", 10) || 20);
  const client = new RunwayML({ apiKey: assertEnvSecret() });

  const blocks: string[] = [
    "# RINPO Live — conversation review",
    "",
    "Contains visitor speech. Do not commit or share. For every weak answer add an entry to",
    "`content/rinpo-knowledge/corrections.md`, then run `runway:sync`.",
    "",
  ];
  let count = 0;
  for await (const summary of client.avatarConversations.list({ avatar: avatarId, limit })) {
    if (count >= limit) break;
    count += 1;
    const detail = await client.avatarConversations.retrieve(summary.id);
    blocks.push(`## ${summary.id}`);
    blocks.push(
      `Started ${"startedAt" in detail && detail.startedAt ? detail.startedAt : summary.createdAt}` +
        ("duration" in detail && detail.duration ? ` · ${detail.duration}s` : ""),
    );
    blocks.push("");
    const lines = "transcript" in detail ? detail.transcript : [];
    for (const entry of lines) {
      if (!entry.content) continue;
      blocks.push(`- **${entry.role === "user" ? "Visitor" : "RINPO"}:** ${entry.content}`);
    }
    blocks.push("");
  }
  if (count === 0) blocks.push("_No conversations yet._");

  const output = `${blocks.join("\n")}\n`;
  if (values.out) {
    writeFileSync(values.out, output);
    console.log(`Wrote ${count} conversation(s) to ${values.out}`);
  } else {
    process.stdout.write(output);
  }
}

async function main(): Promise<void> {
  const [command, ...rest] = process.argv.slice(2);
  if (command === "sync") return sync(rest);
  if (command === "transcripts") return transcripts(rest);
  console.log(HELP);
  if (command && command !== "--help" && command !== "help") process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
