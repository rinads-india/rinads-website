/**
 * Stable marketing + product analytics events.
 * Never send passwords, secrets, API keys, or raw RINPO prompts by default.
 */

export const MARKETING_EVENTS = [
  "landing_viewed",
  "nav_clicked",
  "product_explored",
  "solution_explored",
  "rinpo_demo_started",
  "rinpo_demo_completed",
  "case_study_viewed",
  "security_viewed",
  "pricing_viewed",
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

const SENSITIVE_KEY = /(password|secret|api[_-]?key|token|authorization|prompt|message_body|raw_prompt)/i;

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
