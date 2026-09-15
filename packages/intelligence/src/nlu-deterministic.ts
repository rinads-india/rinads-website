import type { AttentionSignalKind } from "@rinads/salon";
import type { RinpoNluAdapter, RinpoNluContext, RinpoParsedIntent } from "./nlu-types";
import type { RinpoToolInput } from "./types";

function clarify(question: string): RinpoParsedIntent {
  return { kind: "clarify", question };
}

function calls(summary: string, ...calls: RinpoToolInput[]): RinpoParsedIntent {
  return { kind: "tool_calls", calls, summary };
}

function extractNumber(text: string, pattern: RegExp, fallback: number): number {
  const match = text.match(pattern);
  if (!match) return fallback;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : fallback;
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function extractUuid(text: string): string | undefined {
  return text.match(UUID_RE)?.[0];
}

/**
 * The single most-time-sensitive, safely-automatable next step per
 * attention-signal kind — used to resolve "do the first N" against the
 * last `get_salon_business_summary` result. Money-moving signals
 * (pending payments) resolve to a READ tool that surfaces the specifics
 * rather than guessing at an unsafe action; `reactivation_candidates` is
 * the one signal with a genuinely safe one-click WRITE (queuing outreach
 * messages, never charging or refunding anyone).
 */
const ATTENTION_FOLLOW_UP: Record<AttentionSignalKind, (ctx: RinpoNluContext) => RinpoToolInput> = {
  pending_payments: () => ({ tool: "get_pending_payments", args: {} }),
  unconfirmed_bookings: () => ({ tool: "get_today_appointments", args: {} }),
  reactivation_candidates: () => ({ tool: "create_reactivation_campaign", args: {} }),
  empty_slots_today: (ctx) => ({ tool: "get_empty_slots", args: { branchId: ctx.defaultBranchId } }),
  low_staff_utilization: () => ({ tool: "get_staff_utilization", args: {} }),
  // Growth signals (R GLOW Phase E, Slice 1) — all resolve to READ tools,
  // same "never guess at an unsafe action" posture as the rest of this
  // map (a campaign send always needs its own explicit approval step).
  message_failures: () => ({ tool: "get_message_failures", args: {} }),
  pending_campaign_approvals: () => ({ tool: "get_campaign_performance", args: {} }),
  low_repeat_rate: () => ({ tool: "get_retention_summary", args: {} }),
};

const ORDINAL_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

function parseCount(text: string): number | "all" | undefined {
  if (/\ball\b|\bthem\b|\beverything\b/i.test(text)) return "all";
  const digitMatch = text.match(/first\s+(\d+)/i);
  if (digitMatch) return Number(digitMatch[1]);
  const wordMatch = text.match(/first\s+(one|two|three|four|five|six|seven|eight|nine|ten)/i);
  if (wordMatch) return ORDINAL_WORDS[wordMatch[1].toLowerCase()];
  return undefined;
}

/**
 * Deterministic pattern/keyword intent parser (see plan's locked-in NLU
 * decision). Covers the spec's example commands plus close variants with
 * simple parameter extraction (e.g. "last 60 days" -> daysInactive: 60).
 * Ambiguous input returns `clarify` rather than guessing — this adapter
 * never invents an entity ID it wasn't given or handed via context.
 */
export class DeterministicRinpoNluAdapter implements RinpoNluAdapter {
  parse(rawText: string, context: RinpoNluContext): RinpoParsedIntent {
    const text = rawText.trim();
    const lower = text.toLowerCase();

    // "RINPO, check R GLOW and tell me what needs attention."
    if (/\b(what needs attention|check.*(business|salon|r\s?glow)|business summary|daily brief)/i.test(lower)) {
      return calls("Checking what needs attention.", { tool: "get_salon_business_summary", args: {} });
    }

    // "Do the first three." — resolved against the last business summary.
    if (/^do\b/i.test(lower) || /\bdo (the )?first\b/i.test(lower) || /\bdo (all|them)\b/i.test(lower)) {
      const items = context.lastAttentionItems ?? [];
      if (!items.length) {
        return clarify("I don't have a recent list to act on — ask me what needs attention first.");
      }
      const count = parseCount(lower) ?? "all";
      const selected = count === "all" ? items : items.slice(0, count);
      const toolCalls = selected.map((item) => ATTENTION_FOLLOW_UP[item.kind](context));
      return calls(
        `Acting on ${selected.length} item(s): ${selected.map((s) => s.title).join(", ")}.`,
        ...toolCalls
      );
    }

    if (/today'?s appointments|appointments today|what'?s on (the )?calendar today/i.test(lower)) {
      return calls("Pulling today's appointments.", { tool: "get_today_appointments", args: {} });
    }

    if (/empty slots?|open slots?|availability today/i.test(lower)) {
      const branchId = context.defaultBranchId;
      if (!branchId) return clarify("Which branch? I need a branch to check empty slots.");
      return calls("Checking empty slots today.", { tool: "get_empty_slots", args: { branchId } });
    }

    if (/staff utili[sz]ation/i.test(lower)) {
      return calls("Checking staff utilization.", { tool: "get_staff_utilization", args: {} });
    }

    if (/(customer|client) history/i.test(lower)) {
      const customerId = extractUuid(text) ?? context.selectedCustomerId;
      if (!customerId) return clarify("Which customer? Select one or give me their ID.");
      return calls("Pulling customer history.", { tool: "get_customer_history", args: { customerId } });
    }

    // "Create a reactivation campaign for high-value customers inactive
    // for 60 days" — checked *before* the plain "haven't returned" READ
    // pattern below, since it also contains "inactive". Drafts only —
    // never sends (see create_reactivation_draft's own approve/send gate).
    if (/create (a |an )?reactivation (campaign|draft)/i.test(lower)) {
      const daysInactive = extractNumber(lower, /(\d+)\+?\s*days?/i, 60);
      const highValue = /high[- ]value/i.test(lower);
      const args: Record<string, string | number> = { daysInactive };
      // "high-value" is a relative term with no fixed definition in the
      // domain model — 3000 (INR) is a deliberately documented heuristic
      // floor for "worth a special reactivation push", not a real business
      // rule; a manager can always refine the draft's criteria afterwards.
      if (highValue) args.minLifetimeSpend = 3000;
      return calls(
        `Drafting a reactivation campaign for customers inactive ${daysInactive}+ days${highValue ? " (high-value)" : ""}. Preview the audience before sending.`,
        { tool: "create_reactivation_draft", args }
      );
    }

    if (/(haven'?t (booked|returned|visited)|inactive|reactivation|going quiet)/i.test(lower)) {
      const daysInactive = extractNumber(lower, /last\s+(\d+)\s*days?/i, extractNumber(lower, /(\d+)\+?\s*days?/i, 45));
      return calls(`Checking customers inactive for ${daysInactive}+ days.`, { tool: "get_reactivation_candidates", args: { daysInactive } });
    }

    // -----------------------------------------------------------------
    // Growth: segmentation, campaigns, delivery, growth intelligence
    // (R GLOW Phase E, Slice 1).
    // -----------------------------------------------------------------
    if (/preview (the )?audience/i.test(lower)) {
      const campaignId = extractUuid(text) ?? context.lastCampaignDraftId;
      if (!campaignId) return clarify("Which campaign? Draft one first, or give me its ID.");
      return calls("Previewing the campaign audience.", { tool: "preview_segment", args: { campaignId } });
    }

    if (/approve (the |this )?campaign\b|^approve it\b/i.test(lower)) {
      const campaignId = extractUuid(text) ?? context.lastCampaignDraftId;
      if (!campaignId) return clarify("Which campaign should I approve? Give me its ID.");
      return calls("Requesting campaign approval (will need an admin sign-off).", { tool: "approve_campaign", args: { campaignId } });
    }

    if (/^send it\b/i.test(lower) || /\bsend (the |this )?campaign\b/i.test(lower)) {
      const campaignId = extractUuid(text) ?? context.lastCampaignDraftId;
      if (!campaignId) return clarify("Which campaign should I send? Draft one first, or give me its ID.");
      return calls("Requesting to send the campaign (will need an admin sign-off).", { tool: "send_campaign", args: { campaignId } });
    }

    if (/how did.*campaign.*perform|campaign performance/i.test(lower)) {
      return calls("Checking campaign performance.", { tool: "get_campaign_performance", args: {} });
    }

    if (/(which )?messages? failed|failed messages?/i.test(lower)) {
      return calls("Checking failed messages.", { tool: "get_message_failures", args: {} });
    }

    if (/growth opportunit/i.test(lower)) {
      return calls("Checking growth opportunities.", { tool: "get_growth_opportunities", args: {} });
    }

    if (/revenue/i.test(lower)) {
      const days = extractNumber(lower, /last\s+(\d+)\s*days?/i, 30);
      return calls(`Checking revenue for the last ${days} days.`, { tool: "get_revenue_summary", args: { days } });
    }

    if (/service performance|which services|popular services/i.test(lower)) {
      return calls("Checking service performance.", { tool: "get_service_performance", args: {} });
    }

    if (/pending payments|awaiting payment|unpaid (sales|invoices)/i.test(lower)) {
      return calls("Checking pending payments.", { tool: "get_pending_payments", args: {} });
    }

    if (/communication preferences?/i.test(lower)) {
      const customerId = extractUuid(text) ?? context.selectedCustomerId;
      if (!customerId) return clarify("Which customer's communication preferences?");
      return calls("Checking communication preferences.", { tool: "get_customer_communication_preferences", args: { customerId } });
    }

    if (/cancel (this |the )?appointment/i.test(lower)) {
      const appointmentId = extractUuid(text) ?? context.selectedAppointmentId;
      if (!appointmentId) return clarify("Which appointment? Select one or give me its ID.");
      const reasonMatch = text.match(/because\s+(.+)$/i) ?? text.match(/reason[:\s]+(.+)$/i);
      return calls("Cancelling appointment.", {
        tool: "cancel_appointment",
        args: { appointmentId, reason: reasonMatch?.[1] },
      });
    }

    if (/reschedule (this |the )?appointment/i.test(lower)) {
      const appointmentId = extractUuid(text) ?? context.selectedAppointmentId;
      const isoMatch = text.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
      if (!appointmentId || !isoMatch) {
        return clarify("Tell me the appointment and the new time (e.g. 2026-09-10T14:00) to reschedule.");
      }
      return calls("Rescheduling appointment.", { tool: "reschedule_appointment", args: { appointmentId, newStartsAt: isoMatch[0] } });
    }

    if (/send (a )?confirmation/i.test(lower)) {
      const appointmentId = extractUuid(text) ?? context.selectedAppointmentId;
      if (!appointmentId) return clarify("Which appointment's confirmation should I send?");
      return calls("Queuing confirmation.", { tool: "send_appointment_confirmation", args: { appointmentId } });
    }

    if (/send (a )?reminder/i.test(lower)) {
      const appointmentId = extractUuid(text) ?? context.selectedAppointmentId;
      if (!appointmentId) return clarify("Which appointment's reminder should I send?");
      return calls("Queuing reminder.", { tool: "send_appointment_reminder", args: { appointmentId } });
    }

    if (/record (a )?(cash|upi|card|razorpay) payment/i.test(lower)) {
      const saleId = extractUuid(text) ?? context.selectedSaleId;
      const method = lower.match(/\b(cash|upi|card|razorpay)\b/)?.[1];
      const amount = extractNumber(lower, /(?:of|for)\s*(?:rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i, NaN);
      if (!saleId || !method || Number.isNaN(amount)) {
        return clarify("Tell me the sale, the payment method, and the amount to record a payment.");
      }
      return calls("Recording payment.", { tool: "record_payment", args: { saleId, method, amount } });
    }

    if (/refund/i.test(lower)) {
      const saleId = extractUuid(text) ?? context.selectedSaleId;
      const amount = extractNumber(lower, /(\d+(?:\.\d+)?)/i, NaN);
      if (!saleId || Number.isNaN(amount)) {
        return clarify("Tell me the sale and the refund amount — this will need admin approval either way.");
      }
      const reasonMatch = text.match(/because\s+(.+)$/i) ?? text.match(/reason[:\s]+(.+)$/i);
      return calls("Requesting refund (will need approval).", {
        tool: "initiate_refund",
        args: { saleId, amount, reason: reasonMatch?.[1] },
      });
    }

    if (/change (the )?price|update (the )?price/i.test(lower)) {
      const serviceId = extractUuid(text) ?? context.selectedServiceId;
      const newPrice = extractNumber(lower, /to\s*(?:rs\.?|inr)?\s*(\d+(?:\.\d+)?)/i, NaN);
      if (!serviceId || Number.isNaN(newPrice)) {
        return clarify("Tell me the service and the new price — this will need admin approval.");
      }
      return calls("Requesting price change (will need approval).", { tool: "modify_pricing", args: { serviceId, newPrice } });
    }

    if (/apply (a )?discount/i.test(lower)) {
      const saleLineId = extractUuid(text) ?? context.selectedSaleId;
      const discountAmount = extractNumber(lower, /(\d+(?:\.\d+)?)/i, NaN);
      if (!saleLineId || Number.isNaN(discountAmount)) {
        return clarify("Tell me the sale line and the discount amount — this will need admin approval.");
      }
      return calls("Requesting discount (will need approval).", { tool: "modify_discount", args: { saleLineId, discountAmount } });
    }

    if (/issue (an )?(invoice|receipt)/i.test(lower)) {
      const saleId = extractUuid(text) ?? context.selectedSaleId;
      if (!saleId) return clarify("Which sale should I issue an invoice for?");
      return calls("Issuing invoice.", { tool: "issue_receipt_or_invoice", args: { saleId } });
    }

    return clarify("I'm not sure what you'd like me to do. Try \"what needs attention?\" or ask about a specific appointment, sale, or customer.");
  }
}

export const deterministicRinpoNluAdapter = new DeterministicRinpoNluAdapter();
