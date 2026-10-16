/**
 * Stable marketing + product analytics events.
 * Never send passwords, secrets, API keys, or raw form free-text / RINPO prompts.
 */

export const MARKETING_EVENTS = [
  // Funnel events (V2)
  "homepage_view",
  "hero_try_rinpo",
  "hero_book_demo",
  "rinpo_visible",
  "rinpo_opened",
  "rinpo_message_sent",
  "rinpo_conversion_started",
  "rinpo_conversion_completed",
  "rinpo_prompt_started",
  "rinpo_prompt_completed",
  "platform_card_clicked",
  "industry_solution_clicked",
  "pricing_viewed",
  "pricing_plan_selected",
  "pricing_estimate_started",
  "contact_step1_completed",
  "contact_step2_completed",
  "contact_submitted",
  "meeting_requested",
  "lead_submitted",
  "whatsapp_clicked",
  "service_project_started",
  "business_readiness_started",
  "business_readiness_completed",
  "assessment_started",
  "assessment_completed",
  "solution_viewed",
  "demo_started",
  "demo_completed",
  "customer_story_viewed",
  "signin_clicked",
  // Legacy aliases kept for existing call sites
  "landing_viewed",
  "nav_clicked",
  "product_explored",
  "solution_explored",
  "rinpo_demo_started",
  "rinpo_demo_completed",
  "case_study_viewed",
  "security_viewed",
  "demo_booking_started",
  "demo_booking_completed",
  "project_form_started",
  "project_form_completed",
  "signup_started",
  "signup_completed",
  "contact_form_started",
  "contact_form_completed",
] as const;

export const PRODUCT_EVENTS = [
  "organisation_created",
  "first_data_connected",
  "first_rinpo_insight",
  "first_workflow_created",
  "first_workflow_activated",
  "first_member_invited",
  "trial_converted",
  "os_activated",
] as const;

export type MarketingEvent = (typeof MARKETING_EVENTS)[number];
export type ProductEvent = (typeof PRODUCT_EVENTS)[number];
export type AnalyticsEvent = MarketingEvent | ProductEvent;

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

const SENSITIVE_KEY =
  /(password|secret|api[_-]?key|token|authorization|prompt|message_body|raw_prompt|problem|message|current_tools)/i;

function sanitizeProps(props?: AnalyticsProps): AnalyticsProps | undefined {
  if (!props) return undefined;
  const out: AnalyticsProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (SENSITIVE_KEY.test(key)) continue;
    if (typeof value === "string" && value.length > 200) {
      out[key] = `${value.slice(0, 200)}…`;
      continue;
    }
    out[key] = value;
  }
  return out;
}

type AnalyticsSink = (event: AnalyticsEvent, props?: AnalyticsProps) => void;

let sink: AnalyticsSink | null = null;

/** Register a provider (GTM, Segment, etc.). Safe no-op until configured. */
export function registerAnalyticsSink(next: AnalyticsSink | null) {
  sink = next;
}

export function track(event: AnalyticsEvent, props?: AnalyticsProps) {
  const clean = sanitizeProps(props);
  try {
    sink?.(event, clean);
  } catch {
    // Analytics must never break UX.
  }
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", event, clean ?? {});
  }
}

export function trackMarketing(event: MarketingEvent, props?: AnalyticsProps) {
  track(event, props);
}
