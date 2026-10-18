/**
 * Client tool RINPO can call during a live conversation.
 *
 * `suggest_link` lets the character put a page in front of the visitor ("let
 * me show you the services page") without ever emitting a raw URL: the model
 * picks a page *key* from a closed enum and the browser maps it to a route we
 * own. Links open in a new tab so the live call is never interrupted.
 */

import type { RealtimeSessionCreateParams } from "@runwayml/sdk/resources/realtime-sessions";

export type SuggestablePage = {
  label: string;
  href: string;
  /** Short hint given to the model so it picks the right key. */
  when: string;
};

export const SUGGESTABLE_PAGES = {
  services: {
    label: "Services",
    href: "/services",
    when: "the visitor asks what RINADS builds, implements or delivers as a service",
  },
  platform: {
    label: "Platform",
    href: "/platform",
    when: "the visitor asks how the RINADS platform and its operating systems fit together",
  },
  business: {
    label: "Business OS",
    href: "/platform/business",
    when: "the visitor asks about customers, CRM, projects, finance or people tooling",
  },
  commerce: {
    label: "Commerce OS",
    href: "/platform/commerce",
    when: "the visitor asks about products, orders, payments or fulfilment",
  },
  growth: {
    label: "Growth OS",
    href: "/platform/growth",
    when: "the visitor asks about marketing, campaigns, SEO or lead growth",
  },
  automation: {
    label: "Automation OS",
    href: "/platform/automation",
    when: "the visitor asks about workflows, approvals, agents or integrations",
  },
  intelligence: {
    label: "RINADS Intelligence",
    href: "/platform/intelligence",
    when: "the visitor asks how RINADS understands context and recommends next steps",
  },
  rinpo: {
    label: "RINPO",
    href: "/rinpo",
    when: "the visitor asks about RINPO itself, its channels or voice",
  },
  solutions: {
    label: "Industry editions",
    href: "/solutions",
    when: "the visitor asks about a specific industry such as salon, retail or landscape",
  },
  pricing: {
    label: "Pricing",
    href: "/pricing",
    when: "the visitor asks about cost, plans or packaging",
  },
  academy: {
    label: "Academy",
    href: "/resources/academy",
    when: "the visitor asks about training, courses or certification",
  },
  contact: {
    label: "Contact & demo",
    href: "/company/contact",
    when: "the visitor wants a demo, consultation, quote or to talk to the team",
  },
} as const satisfies Record<string, SuggestablePage>;

export type SuggestablePageKey = keyof typeof SUGGESTABLE_PAGES;

export const SUGGEST_LINK_TOOL_NAME = "suggest_link";

export type SuggestLinkArgs = { page?: string };

export function isSuggestablePageKey(value: unknown): value is SuggestablePageKey {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(SUGGESTABLE_PAGES, value)
  );
}

/** Resolve a model-supplied page key to a vetted link, or null. */
export function resolveSuggestedLink(
  args: unknown,
): { key: SuggestablePageKey; label: string; href: string } | null {
  if (args === null || typeof args !== "object") return null;
  const page = (args as SuggestLinkArgs).page;
  if (!isSuggestablePageKey(page)) return null;
  const { label, href } = SUGGESTABLE_PAGES[page];
  return { key: page, label, href };
}

/** Tool definition sent to Runway when the session is created. */
export const SUGGEST_LINK_TOOL: RealtimeSessionCreateParams.ClientEvent = {
  type: "client_event",
  name: SUGGEST_LINK_TOOL_NAME,
  description:
    "Show the visitor a link card to a RINADS website page while you keep talking. " +
    "Call it at most once per topic, only when a page would genuinely help. " +
    "Never read the link aloud.",
  parameters: [
    {
      type: "string",
      name: "page",
      description:
        "Which page to show. " +
        (Object.entries(SUGGESTABLE_PAGES) as [string, SuggestablePage][])
          .map(([key, page]) => `${key}: ${page.when}`)
          .join("; "),
      enum: Object.keys(SUGGESTABLE_PAGES),
    },
  ],
};
