import type { NotificationAdapter, NotificationAdapterResult } from "./types";

function readEnv(key: string): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.[key];
}

export type EmailAdapterConfig = {
  /** When set, POST JSON { recipient, templateKey, payload } to this URL. 2xx = sent. */
  webhookUrl?: string;
  fetchImpl?: typeof fetch;
};

export type WhatsAppAdapterConfig = {
  supabaseUrl?: string;
  serviceRoleKey?: string;
  fetchImpl?: typeof fetch;
};

/**
 * Runtime email adapter — never fabricates success.
 * Without `RINADS_EMAIL_WEBHOOK_URL` (or an explicit webhookUrl), returns
 * `{ ok: false, error: "not_configured" }` so the outbox fails honestly.
 */
export function createEmailAdapter(config: EmailAdapterConfig = {}): NotificationAdapter {
  const fetchImpl = config.fetchImpl ?? fetch;

  return {
    channel: "email",
    async send(input): Promise<NotificationAdapterResult> {
      const webhookUrl = config.webhookUrl ?? readEnv("RINADS_EMAIL_WEBHOOK_URL");
      if (!webhookUrl) {
        return { ok: false, error: "not_configured" };
      }
      try {
        const response = await fetchImpl(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: input.recipient,
            templateKey: input.templateKey,
            payload: input.payload,
          }),
        });
        if (!response.ok) {
          return { ok: false, error: `email webhook responded ${response.status}` };
        }
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "email send failed" };
      }
    },
  };
}

/**
 * Runtime WhatsApp adapter — calls `notify-whatsapp` when Supabase credentials
 * are present; otherwise returns `not_configured` (same honesty contract as
 * salon-server's Twilio adapter). Never returns ok on missing config.
 */
export function createWhatsAppAdapter(config: WhatsAppAdapterConfig = {}): NotificationAdapter {
  const fetchImpl = config.fetchImpl ?? fetch;

  return {
    channel: "whatsapp",
    async send(input): Promise<NotificationAdapterResult> {
      const supabaseUrl = config.supabaseUrl ?? readEnv("SUPABASE_URL") ?? readEnv("NEXT_PUBLIC_SUPABASE_URL");
      const serviceRoleKey = config.serviceRoleKey ?? readEnv("SUPABASE_SERVICE_ROLE_KEY");
      if (!supabaseUrl || !serviceRoleKey) {
        return { ok: false, error: "not_configured" };
      }
      try {
        const messageBody = String(input.payload.messageBody ?? input.templateKey);
        const response = await fetchImpl(`${supabaseUrl}/functions/v1/notify-whatsapp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            recipient: input.recipient,
            template: input.templateKey,
            message_body: messageBody,
            organization_id: input.payload.organizationId,
          }),
        });

        let json: Record<string, unknown> = {};
        try {
          json = (await response.json()) as Record<string, unknown>;
        } catch {
          // non-JSON body falls through
        }

        if (!response.ok) {
          return {
            ok: false,
            error: typeof json.error === "string" ? json.error : `notify-whatsapp responded ${response.status}`,
          };
        }
        if (json.status === "not_configured") {
          return { ok: false, error: "not_configured" };
        }
        if (json.status === "sent") {
          return { ok: true };
        }
        if (json.status === "failed") {
          return {
            ok: false,
            error: typeof json.error === "string" ? json.error : "Twilio send failed",
          };
        }
        return { ok: false, error: "notify-whatsapp returned an unexpected response" };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "whatsapp send failed" };
      }
    },
  };
}

/** Default adapters resolve config from the environment at send time. */
export const emailAdapter: NotificationAdapter = createEmailAdapter();
export const whatsappAdapter: NotificationAdapter = createWhatsAppAdapter();
