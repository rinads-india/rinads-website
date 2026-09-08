import type { AttentionItem } from "@rinads/salon";
import type { RinpoToolInput } from "./types";

/**
 * Context the command bar can supply alongside free text — mostly
 * "what's currently selected/visible" so the deterministic parser doesn't
 * have to resolve a customer/appointment *name* to an ID itself (out of
 * scope for a dependency-free pattern matcher; a future `LlmRinpoNluAdapter`
 * could do real entity resolution without changing this interface).
 */
export type RinpoNluContext = {
  organizationId: string;
  /** Attention items from the most recent `get_salon_business_summary` call, so "do the first three" is resolvable. */
  lastAttentionItems?: AttentionItem[];
  defaultBranchId?: string;
  selectedAppointmentId?: string;
  selectedSaleId?: string;
  selectedCustomerId?: string;
  selectedServiceId?: string;
  /** The most recently drafted campaign this session, so "preview the audience" / "send it" resolve without repeating the ID. */
  lastCampaignDraftId?: string;
};

export type RinpoParsedIntent =
  | { kind: "tool_calls"; calls: RinpoToolInput[]; summary: string }
  | { kind: "clarify"; question: string };

/**
 * Provider-agnostic seam (see plan's "Deterministic NLU" section): today
 * only `DeterministicRinpoNluAdapter` implements this. A future
 * `LlmRinpoNluAdapter` (AI SDK) could implement the same interface without
 * touching the tool-execution pipeline downstream.
 */
export type RinpoNluAdapter = {
  parse(text: string, context: RinpoNluContext): RinpoParsedIntent;
};
