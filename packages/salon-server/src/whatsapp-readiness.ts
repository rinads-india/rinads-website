/**
 * Per-organization WhatsApp send gate for R GLOW.
 *
 * Enqueue stays unrestricted (outbox is the source of truth). Delivery is
 * blocked unless the org flag is on AND mode is sandbox (allowlisted
 * recipient) or live. Missing config is treated as off — never as an
 * implicit "send".
 */
import type { SalonSupabaseClient } from "./client";
import type { CommunicationsFunnel, SalonCommunicationsRepository } from "./communications-repository";

export const WHATSAPP_SEND_FLAG_KEY = "salon.whatsapp.send_enabled";

export type WhatsAppMode = "off" | "sandbox" | "live";

export type WhatsAppOrgConfig = {
  mode: WhatsAppMode;
  sandboxAllowlist: string[];
  updatedAt?: string;
};

export type WhatsAppSendGate =
  | { allowed: true; mode: Exclude<WhatsAppMode, "off"> }
  | { allowed: false; reason: string };

export function normalizeWhatsAppRecipient(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return hasPlus || digits.length > 10 ? `+${digits}` : `+91${digits}`;
}

export function parseWhatsAppOrgConfig(settingsJson: unknown): WhatsAppOrgConfig {
  const settings = settingsJson && typeof settingsJson === "object" && !Array.isArray(settingsJson)
    ? (settingsJson as Record<string, unknown>)
    : {};
  const communications = settings.communications && typeof settings.communications === "object" && !Array.isArray(settings.communications)
    ? (settings.communications as Record<string, unknown>)
    : {};
  const whatsapp = communications.whatsapp && typeof communications.whatsapp === "object" && !Array.isArray(communications.whatsapp)
    ? (communications.whatsapp as Record<string, unknown>)
    : {};
  const modeRaw = typeof whatsapp.mode === "string" ? whatsapp.mode.trim().toLowerCase() : "off";
  const mode: WhatsAppMode = modeRaw === "sandbox" || modeRaw === "live" ? modeRaw : "off";
  const allowlistRaw = Array.isArray(whatsapp.sandboxAllowlist)
    ? whatsapp.sandboxAllowlist
    : Array.isArray(whatsapp.sandbox_allowlist)
      ? whatsapp.sandbox_allowlist
      : [];
  const sandboxAllowlist = [...new Set(
    allowlistRaw
      .map((value) => normalizeWhatsAppRecipient(String(value ?? "")))
      .filter(Boolean)
  )];
  return {
    mode,
    sandboxAllowlist,
    updatedAt: typeof whatsapp.updatedAt === "string" ? whatsapp.updatedAt : undefined,
  };
}

export function isSandboxAllowlisted(recipient: string, allowlist: string[]): boolean {
  const normalized = normalizeWhatsAppRecipient(recipient);
  if (!normalized) return false;
  const allowed = new Set(allowlist.map((entry) => normalizeWhatsAppRecipient(entry)).filter(Boolean));
  return allowed.has(normalized);
}

export function evaluateWhatsAppSendGate(input: {
  sendEnabled: boolean;
  config: WhatsAppOrgConfig;
  recipient: string;
}): WhatsAppSendGate {
  if (!input.sendEnabled) {
    return { allowed: false, reason: "WhatsApp sending is off for this salon (salon.whatsapp.send_enabled)." };
  }
  if (input.config.mode === "off") {
    return { allowed: false, reason: "WhatsApp mode is off. Set sandbox or live in Settings → Communications." };
  }
  if (input.config.mode === "sandbox" && !isSandboxAllowlisted(input.recipient, input.config.sandboxAllowlist)) {
    return {
      allowed: false,
      reason: "Recipient is not on this salon's WhatsApp sandbox allowlist.",
    };
  }
  return { allowed: true, mode: input.config.mode };
}

export async function loadWhatsAppOrgState(
  client: SalonSupabaseClient,
  organizationId: string
): Promise<{ sendEnabled: boolean; config: WhatsAppOrgConfig }> {
  const [{ data: overrideRows }, { data: settingsRow }] = await Promise.all([
    client
      .from("feature_flag_overrides")
      .select("enabled, user_id")
      .eq("flag_key", WHATSAPP_SEND_FLAG_KEY)
      .eq("organization_id", organizationId),
    client.from("organization_settings").select("settings").eq("organization_id", organizationId).maybeSingle(),
  ]);
  const overrides = Array.isArray(overrideRows) ? overrideRows : overrideRows ? [overrideRows] : [];
  const override = overrides.find((row) => row && typeof row === "object" && (row as { user_id?: unknown }).user_id == null);
  const sendEnabled = Boolean(override && typeof override === "object" && "enabled" in override && override.enabled);
  const config = parseWhatsAppOrgConfig(
    settingsRow && typeof settingsRow === "object" ? (settingsRow as { settings?: unknown }).settings : undefined
  );
  return { sendEnabled, config };
}

export async function loadWhatsAppSendGate(
  client: SalonSupabaseClient,
  organizationId: string,
  recipient: string
): Promise<WhatsAppSendGate> {
  const state = await loadWhatsAppOrgState(client, organizationId);
  return evaluateWhatsAppSendGate({ ...state, recipient });
}

export type WhatsAppReadiness = {
  sendEnabled: boolean;
  mode: WhatsAppMode;
  sandboxAllowlist: string[];
  updatedAt?: string;
  funnel: CommunicationsFunnel;
  checklist: Array<{ key: string; ok: boolean; label: string; detail: string }>;
  readyForSandboxTick: boolean;
  operatorSummary: string;
};

const EMPTY_FUNNEL: CommunicationsFunnel = {
  total: 0,
  queued: 0,
  sent: 0,
  delivered: 0,
  read: 0,
  failed: 0,
  notConfigured: 0,
  deadLetter: 0,
  deliveryRatePct: 0,
  failureRatePct: 0,
};

export async function getWhatsAppReadiness(
  client: SalonSupabaseClient,
  communications: SalonCommunicationsRepository,
  organizationId: string
): Promise<WhatsAppReadiness> {
  const [{ sendEnabled, config }, funnelResult] = await Promise.all([
    loadWhatsAppOrgState(client, organizationId),
    communications.funnel(organizationId),
  ]);
  const funnel = funnelResult.ok ? funnelResult.data : EMPTY_FUNNEL;
  const sandboxReady = config.mode === "sandbox" && config.sandboxAllowlist.length > 0;
  const liveReady = config.mode === "live";
  const checklist: WhatsAppReadiness["checklist"] = [
    {
      key: "flag",
      ok: sendEnabled,
      label: "Organization send flag",
      detail: sendEnabled
        ? "salon.whatsapp.send_enabled is on for this salon."
        : "Off (default). Delivery stays blocked even if the worker runs.",
    },
    {
      key: "mode",
      ok: config.mode !== "off",
      label: "Delivery mode",
      detail:
        config.mode === "off"
          ? "Off — enqueue still works; nothing is handed to Twilio."
          : config.mode === "sandbox"
            ? "Sandbox — only allowlisted numbers can be sent."
            : "Live — every eligible recipient can be sent once worker + Twilio are on.",
    },
    {
      key: "allowlist",
      ok: config.mode !== "sandbox" || config.sandboxAllowlist.length > 0,
      label: "Sandbox allowlist",
      detail:
        config.mode !== "sandbox"
          ? "Not required unless mode is sandbox."
          : config.sandboxAllowlist.length
            ? `${config.sandboxAllowlist.length} number(s) allowlisted.`
            : "Empty — sandbox sends will be blocked with an honest error.",
    },
    {
      key: "outbox",
      ok: funnel.failed + funnel.deadLetter === 0,
      label: "Recent delivery failures",
      detail:
        funnel.total === 0
          ? "No outbox rows yet."
          : `${funnel.queued} queued · ${funnel.notConfigured} not configured · ${funnel.failed} failed · ${funnel.deadLetter} dead letter · ${funnel.sent + funnel.delivered + funnel.read} handed to Twilio.`,
    },
    {
      key: "ops",
      ok: false,
      label: "Worker + Twilio (founder)",
      detail:
        "The communications worker and Twilio secrets live on the scheduler / notify-whatsapp Edge Function, not in this console. They stay off until a founder follows docs/deployment/RGLOW_WHATSAPP_GOLIVE.md.",
    },
  ];
  const readyForSandboxTick = sendEnabled && (sandboxReady || liveReady);
  const operatorSummary = readyForSandboxTick
    ? "This salon is configured to send once a founder enables the worker on an allowlisted tick with Twilio sandbox credentials. Nothing is sending from production until that ops step happens."
    : "WhatsApp delivery is off for this salon. Messages still enqueue as pending so you can see them under Communications.";

  return {
    sendEnabled,
    mode: config.mode,
    sandboxAllowlist: config.sandboxAllowlist,
    updatedAt: config.updatedAt,
    funnel,
    checklist,
    readyForSandboxTick,
    operatorSummary,
  };
}
