"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  GraduationCap,
  MessageCircle,
  SearchCheck,
  Sparkles,
} from "lucide-react";
import { RINPOAvatar } from "@/components/system";
import { trackMarketing, type MarketingEvent } from "@/lib/analytics";

type StartClientProps = {
  whatsappUrl?: string;
};

type ActionCard = {
  title: string;
  description: string;
  href: string;
  event: MarketingEvent;
  icon: typeof ArrowRight;
  primary?: boolean;
};

const TRACKING_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

function appendAttribution(href: string, params: URLSearchParams) {
  const url = new URL(href, "https://rinads.local");
  url.searchParams.set("source", "start");
  for (const key of TRACKING_KEYS) {
    const value = params.get(key);
    if (value) url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function StartClient({ whatsappUrl }: StartClientProps) {
  const searchParams = useSearchParams();
  const attribution = new URLSearchParams(searchParams.toString());

  const actions: ActionCard[] = [
    {
      title: "Book a 30-minute demo",
      description: "See the RINADS platform around the way your business actually operates.",
      href: appendAttribution("/contact?intent=demo", attribution),
      event: "demo_booking_started",
      icon: BriefcaseBusiness,
      primary: true,
    },
    {
      title: "Free Business Simplified Audit",
      description: "Request a practical review of your current business setup, digital presence and operating gaps.",
      href: appendAttribution("/contact?intent=audit", attribution),
      event: "nav_clicked",
      icon: SearchCheck,
      primary: true,
    },
    {
      title: "Talk to RINPO",
      description: "Explore the intelligent interface to RINADS in English or Malayalam.",
      href: appendAttribution("/rinpo/live", attribution),
      event: "rinpo_opened",
      icon: Bot,
    },
    {
      title: "Explore industry solutions",
      description: "Salon, jewellery, retail, landscape and other industry configurations on the shared core.",
      href: appendAttribution("/solutions", attribution),
      event: "industry_solution_clicked",
      icon: Sparkles,
    },
    {
      title: "Learn with RINADS Academy",
      description: "Business, AI, digital and technology learning connected to real work.",
      href: appendAttribution("/resources/academy", attribution),
      event: "nav_clicked",
      icon: GraduationCap,
    },
    {
      title: "Partner with RINADS",
      description: "Talk to the team about implementation, referrals, integrations or strategic collaboration.",
      href: appendAttribution("/contact?intent=partner", attribution),
      event: "nav_clicked",
      icon: MessageCircle,
    },
  ];

  return (
    <main className="relative overflow-hidden px-6 pb-24 pt-28 md:px-12 lg:px-20">
      <div className="pointer-events-none absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-rinads-primary/15 blur-3xl" />

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">RINADS · Business Simplified.</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.045em] text-foreground sm:text-5xl lg:text-7xl">
            Start with what you need to simplify.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            Choose the fastest path into RINADS — a business audit, an industry demo, RINPO, Academy, or a conversation with the team.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">Built in Thrissur</span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">Built for the world</span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5">Human handoff when needed</span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-rinads-primary/25 bg-gradient-to-b from-rinads-primary/10 to-transparent">
            <RINPOAvatar variant="full" className="h-full w-full" alt="RINPO from RINADS" />
            <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/10 bg-black/65 p-4 text-white backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rinads-primary">RINPO from RINADS</p>
              <p className="mt-1 text-sm">Your guide to Business Simplified.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto mt-16 max-w-7xl" aria-labelledby="start-actions-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rinads-primary">Choose your next step</p>
            <h2 id="start-actions-heading" className="mt-2 text-2xl font-bold tracking-[-0.03em] text-foreground md:text-3xl">
              One entry point. Clear routes.
            </h2>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">Your choice is used only to route you to the right RINADS experience. No invented claims or automatic commitments.</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                onClick={() => trackMarketing(action.event, { sourcePath: "/start", destination: action.href })}
                className={`group rounded-2xl border p-6 transition duration-200 hover:-translate-y-0.5 hover:border-rinads-primary/55 ${
                  action.primary
                    ? "border-rinads-primary/35 bg-rinads-primary/[0.08]"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-rinads-primary/10 text-rinads-primary">
                    <Icon size={20} aria-hidden />
                  </span>
                  <ArrowRight size={18} className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-rinads-primary" aria-hidden />
                </div>
                <h3 className="mt-5 text-lg font-bold text-foreground">{action.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.description}</p>
              </Link>
            );
          })}
        </div>

        {whatsappUrl ? (
          <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-foreground">Prefer WhatsApp?</p>
              <p className="mt-1 text-sm text-muted-foreground">Start a conversation and the RINADS team can route you from there.</p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackMarketing("whatsapp_clicked", { sourcePath: "/start" })}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-rinads-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <MessageCircle size={17} aria-hidden />
              Open WhatsApp
            </a>
          </div>
        ) : null}
      </section>
    </main>
  );
}
