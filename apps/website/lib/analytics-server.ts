// Server-side event log — writes to ri_event_log table (created by migration).
// Non-blocking: errors are swallowed so analytics never breaks request handling.

import { createClient } from "@supabase/supabase-js";

export type ServerEventName =
  | "order_created"
  | "order_paid"
  | "order_assigned"
  | "whatsapp_sent"
  | "whatsapp_failed"
  | "search_api_call"
  | "world_bootstrap_call"
  | "rinpo_chat_llm"
  | "rinpo_chat_rules";

export function logServerEvent(
  event: ServerEventName,
  properties: Record<string, unknown> = {},
  organizationId?: string,
): void {
  // Fire-and-forget — intentionally no await
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return;

  const client = createClient(supabaseUrl, serviceKey);
  client
    .from("ri_event_log")
    .insert({
      event_name: event,
      properties,
      organization_id: organizationId ?? null,
    })
    .then(({ error }) => {
      if (error && process.env.NODE_ENV === "development") {
        console.warn("[RI Analytics server]", event, error.message);
      }
    });
}
