/**
 * Growth / Ads / YouTube — one campaign + content model across channels, and an explainable,
 * policy-governed ad signal engine. Official provider APIs are the only authoritative source of
 * ad metrics; this module never scrapes or automates a browser. When no metrics have been
 * imported the engine returns nothing and the UI says "not connected".
 */

export const CONTENT_CHANNELS = [
  "web",
  "blog",
  "youtube",
  "youtube_shorts",
  "instagram",
  "facebook",
  "linkedin",
  "x",
  "whatsapp",
  "email",
  "google_business",
  "paid_ads",
] as const;

export type ContentChannel = (typeof CONTENT_CHANNELS)[number];

export const CHANNEL_LABEL: Record<ContentChannel, string> = {
  web: "Website",
  blog: "Blog",
  youtube: "YouTube",
  youtube_shorts: "YouTube Shorts",
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X",
  whatsapp: "WhatsApp",
  email: "Email",
  google_business: "Google Business",
  paid_ads: "Paid ads",
};

export type ContentStatus = "idea" | "drafting" | "in_review" | "approved" | "scheduled" | "published" | "archived";

export type ContentItem = {
  id: string;
  campaignId: string | null;
  /** All variants of one idea share a `sourceIdeaId` (the idea's own id for the root item). */
  sourceIdeaId: string;
  channel: ContentChannel;
  status: ContentStatus;
  title: string;
  assetId: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  externalUrl: string | null;
};

export function isContentChannel(value: string): value is ContentChannel {
  return (CONTENT_CHANNELS as readonly string[]).includes(value);
}

export type ContentProblem = { code: string; message: string };

export function validateContentItem(item: ContentItem, source?: ContentItem): ContentProblem[] {
  const problems: ContentProblem[] = [];
  if (!isContentChannel(item.channel)) problems.push({ code: "bad_channel", message: `Unknown channel ${item.channel}` });
  if (item.status === "scheduled" && !item.scheduledAt) problems.push({ code: "no_schedule", message: "Scheduled content needs a schedule time." });
  if (item.status === "published" && !item.publishedAt) problems.push({ code: "no_publish_time", message: "Published content needs a published time." });
  if ((item.status === "approved" || item.status === "scheduled" || item.status === "published") && !item.assetId && item.channel !== "paid_ads") {
    problems.push({ code: "no_asset", message: "Approved content must reference an asset." });
  }
  if (source && source.sourceIdeaId !== item.sourceIdeaId) {
    problems.push({ code: "idea_mismatch", message: "Variant must share the source idea of its campaign root." });
  }
  return problems;
}

/** Group variants by idea so the UI can show one idea → many channel variants. */
export function groupByIdea(items: readonly ContentItem[]): { sourceIdeaId: string; title: string; variants: ContentItem[] }[] {
  const groups = new Map<string, ContentItem[]>();
  for (const item of items) {
    const list = groups.get(item.sourceIdeaId) ?? [];
    list.push(item);
    groups.set(item.sourceIdeaId, list);
  }
  return [...groups.entries()].map(([sourceIdeaId, variants]) => ({
    sourceIdeaId,
    title: (variants.find((v) => v.id === sourceIdeaId) ?? variants[0]).title,
    variants,
  }));
}

// ── Ads signals ───────────────────────────────────────────────────────────────

export type AdDay = {
  adId: string;
  adName: string;
  campaignId: string | null;
  platform: string;
  date: string; // YYYY-MM-DD
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  /** Optional creative/audience/landing labels for hook/audience/landing analysis. */
  hook?: string | null;
  audience?: string | null;
  landingPage?: string | null;
  frequency?: number | null;
};

export type AdThresholds = {
  /** Minimum impressions before CTR is trusted. */
  minImpressions: number;
  /** Minimum clicks before conversion rate is trusted. */
  minClicks: number;
  /** CTR below this (percent) is flagged. null = not configured (no signal). */
  minCtrPct: number | null;
  /** Cost per conversion above this is flagged. null = not configured (no signal). */
  maxCostPerConversion: number | null;
  /** Relative CTR decline recent vs prior that indicates fatigue. */
  fatigueDropRatio: number;
  /** Frequency above this suggests fatigue when present. */
  fatigueFrequency: number;
};

export const DEFAULT_AD_THRESHOLDS: AdThresholds = {
  minImpressions: 1000,
  minClicks: 50,
  minCtrPct: null,
  maxCostPerConversion: null,
  fatigueDropRatio: 0.25,
  fatigueFrequency: 4,
};

export type AdSignalKind = "fatigue" | "low_ctr" | "high_cost_per_conversion" | "winning_hook" | "winning_audience" | "landing_mismatch";

export type AdSignal = {
  id: string;
  kind: AdSignalKind;
  severity: "info" | "attention" | "critical";
  adId: string | null;
  campaignId: string | null;
  title: string;
  /** Exact numbers behind the signal. */
  evidence: string;
  recommendation: string;
  /** Governed action this would map to; never executed automatically. */
  actionKey: "ads.budget_change" | "content.create_variant" | null;
  requiresApproval: boolean;
  basis: "observed" | "default_threshold" | "configured_threshold";
};

function ctr(impressions: number, clicks: number): number {
  return impressions > 0 ? (clicks / impressions) * 100 : 0;
}

function sum(days: readonly AdDay[], key: "spend" | "impressions" | "clicks" | "conversions"): number {
  return days.reduce((s, d) => s + d[key], 0);
}

export function detectAdSignals(days: readonly AdDay[], thresholds: AdThresholds = DEFAULT_AD_THRESHOLDS): AdSignal[] {
  if (days.length === 0) return [];
  const signals: AdSignal[] = [];
  const byAd = new Map<string, AdDay[]>();
  for (const d of days) {
    const list = byAd.get(d.adId) ?? [];
    list.push(d);
    byAd.set(d.adId, list);
  }

  for (const [adId, rows] of byAd) {
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    const name = sorted[0].adName;
    const campaignId = sorted[0].campaignId;
    const totalImpr = sum(sorted, "impressions");
    const totalClicks = sum(sorted, "clicks");
    const totalConv = sum(sorted, "conversions");
    const totalSpend = sum(sorted, "spend");

    // Fatigue: recent 3 days CTR vs prior days, with enough volume on both sides.
    if (sorted.length >= 6) {
      const recent = sorted.slice(-3);
      const prior = sorted.slice(0, -3);
      const rImpr = sum(recent, "impressions");
      const pImpr = sum(prior, "impressions");
      if (rImpr >= thresholds.minImpressions / 2 && pImpr >= thresholds.minImpressions) {
        const rc = ctr(rImpr, sum(recent, "clicks"));
        const pc = ctr(pImpr, sum(prior, "clicks"));
        const lastFreq = recent[recent.length - 1].frequency ?? null;
        if (pc > 0 && (pc - rc) / pc >= thresholds.fatigueDropRatio) {
          signals.push({
            id: `fatigue:${adId}`,
            kind: "fatigue",
            severity: "attention",
            adId,
            campaignId,
            title: `Possible creative fatigue: ${name}`,
            evidence: `CTR fell from ${pc.toFixed(2)}% (prior ${prior.length}d) to ${rc.toFixed(2)}% (last 3d)${lastFreq !== null ? `; frequency ${lastFreq}` : ""}.`,
            recommendation: "Rotate in a fresh creative variant; reduce spend on this ad until a variant is live.",
            actionKey: "content.create_variant",
            requiresApproval: false,
            basis: "default_threshold",
          });
        } else if (lastFreq !== null && lastFreq >= thresholds.fatigueFrequency && rc < pc) {
          signals.push({
            id: `fatigue-freq:${adId}`,
            kind: "fatigue",
            severity: "info",
            adId,
            campaignId,
            title: `High frequency on ${name}`,
            evidence: `Frequency ${lastFreq} (≥ ${thresholds.fatigueFrequency}) and CTR is softening (${pc.toFixed(2)}% → ${rc.toFixed(2)}%).`,
            recommendation: "Expand the audience or rotate creative before CTR declines further.",
            actionKey: "content.create_variant",
            requiresApproval: false,
            basis: "default_threshold",
          });
        }
      }
    }

    // Low CTR (only when a target is configured and volume is sufficient).
    if (thresholds.minCtrPct !== null && totalImpr >= thresholds.minImpressions) {
      const c = ctr(totalImpr, totalClicks);
      if (c < thresholds.minCtrPct) {
        signals.push({
          id: `low-ctr:${adId}`,
          kind: "low_ctr",
          severity: "attention",
          adId,
          campaignId,
          title: `Low CTR: ${name}`,
          evidence: `CTR ${c.toFixed(2)}% over ${totalImpr.toLocaleString("en-IN")} impressions, below the configured ${thresholds.minCtrPct}% target.`,
          recommendation: "Test a different hook or thumbnail; consider reducing budget until CTR improves.",
          actionKey: "ads.budget_change",
          requiresApproval: true,
          basis: "configured_threshold",
        });
      }
    }

    // High cost per conversion (only when a ceiling is configured and there is spend).
    if (thresholds.maxCostPerConversion !== null && totalSpend > 0) {
      const cpc = totalConv > 0 ? totalSpend / totalConv : null;
      if (cpc === null && totalClicks >= thresholds.minClicks) {
        signals.push({
          id: `no-conv:${adId}`,
          kind: "high_cost_per_conversion",
          severity: "critical",
          adId,
          campaignId,
          title: `Spend without conversions: ${name}`,
          evidence: `${totalSpend.toLocaleString("en-IN")} spent, ${totalClicks} clicks, 0 conversions.`,
          recommendation: "Pause or restructure; check the landing page and tracking before spending more.",
          actionKey: "ads.budget_change",
          requiresApproval: true,
          basis: "configured_threshold",
        });
      } else if (cpc !== null && cpc > thresholds.maxCostPerConversion) {
        signals.push({
          id: `cpl:${adId}`,
          kind: "high_cost_per_conversion",
          severity: cpc > thresholds.maxCostPerConversion * 1.5 ? "critical" : "attention",
          adId,
          campaignId,
          title: `Cost per conversion above target: ${name}`,
          evidence: `${cpc.toFixed(2)} per conversion vs configured ceiling ${thresholds.maxCostPerConversion}.`,
          recommendation: "Reduce budget or narrow targeting; compare against the best-performing hook.",
          actionKey: "ads.budget_change",
          requiresApproval: true,
          basis: "configured_threshold",
        });
      }
    }

    // Landing mismatch: healthy CTR but poor click→conversion.
    if (totalImpr >= thresholds.minImpressions && totalClicks >= thresholds.minClicks) {
      const c = ctr(totalImpr, totalClicks);
      const cvr = (totalConv / totalClicks) * 100;
      const portfolio = days.reduce((s, d) => s + d.clicks, 0);
      const portfolioCvr = portfolio > 0 ? (days.reduce((s, d) => s + d.conversions, 0) / portfolio) * 100 : 0;
      if (c >= 1 && portfolioCvr > 0 && cvr < portfolioCvr * 0.4) {
        signals.push({
          id: `landing:${adId}`,
          kind: "landing_mismatch",
          severity: "attention",
          adId,
          campaignId,
          title: `Landing page may not match the ad: ${name}`,
          evidence: `CTR ${c.toFixed(2)}% but click→conversion ${cvr.toFixed(2)}% vs portfolio ${portfolioCvr.toFixed(2)}%${sorted[0].landingPage ? ` (landing: ${sorted[0].landingPage})` : ""}.`,
          recommendation: "Align the landing page headline and offer with the ad promise before adding budget.",
          actionKey: null,
          requiresApproval: false,
          basis: "observed",
        });
      }
    }
  }

  // Winning hook / audience: best conversion rate with enough clicks, clearly above the mean.
  const winner = (label: "hook" | "audience", kind: "winning_hook" | "winning_audience") => {
    const groups = new Map<string, { clicks: number; conv: number }>();
    for (const d of days) {
      const key = d[label];
      if (!key) continue;
      const g = groups.get(key) ?? { clicks: 0, conv: 0 };
      g.clicks += d.clicks;
      g.conv += d.conversions;
      groups.set(key, g);
    }
    const eligible = [...groups.entries()].filter(([, g]) => g.clicks >= thresholds.minClicks);
    if (eligible.length < 2) return;
    const meanCvr = eligible.reduce((s, [, g]) => s + g.conv, 0) / Math.max(1, eligible.reduce((s, [, g]) => s + g.clicks, 0));
    const [bestKey, best] = eligible.sort((a, b) => b[1].conv / b[1].clicks - a[1].conv / a[1].clicks)[0];
    const bestCvr = best.conv / best.clicks;
    if (meanCvr > 0 && bestCvr >= meanCvr * 1.5) {
      signals.push({
        id: `${kind}:${bestKey}`,
        kind,
        severity: "info",
        adId: null,
        campaignId: null,
        title: `Winning ${label}: ${bestKey}`,
        evidence: `${(bestCvr * 100).toFixed(2)}% click→conversion over ${best.clicks} clicks vs ${(meanCvr * 100).toFixed(2)}% average.`,
        recommendation: `Brief Studio to produce more variants built on this ${label}.`,
        actionKey: "content.create_variant",
        requiresApproval: false,
        basis: "observed",
      });
    }
  };
  winner("hook", "winning_hook");
  winner("audience", "winning_audience");

  const rank = { critical: 3, attention: 2, info: 1 } as const;
  return signals.sort((a, b) => rank[b.severity] - rank[a.severity] || a.id.localeCompare(b.id));
}

export type BudgetPolicy = {
  /** Relative change above which approval is required (default 20%). */
  maxAutoChangePct: number;
  /** Absolute daily budget above which any increase needs approval. */
  highBudgetThreshold: number | null;
};

export const DEFAULT_BUDGET_POLICY: BudgetPolicy = { maxAutoChangePct: 20, highBudgetThreshold: null };

/** Ads budget changes always go through the governed pipeline; this classifies the risk. */
export function classifyBudgetChange(
  current: number,
  proposed: number,
  policy: BudgetPolicy = DEFAULT_BUDGET_POLICY
): { risk: "MEDIUM" | "HIGH" | "CRITICAL"; changePct: number | null; reason: string } {
  if (current <= 0) {
    return { risk: "HIGH", changePct: null, reason: "Setting a first budget from zero is a spend commitment." };
  }
  const changePct = ((proposed - current) / current) * 100;
  const abs = Math.abs(changePct);
  if (policy.highBudgetThreshold !== null && proposed > policy.highBudgetThreshold) {
    return { risk: "CRITICAL", changePct, reason: `Proposed budget ${proposed} exceeds the high-budget threshold ${policy.highBudgetThreshold}.` };
  }
  if (abs > policy.maxAutoChangePct) {
    return { risk: "HIGH", changePct, reason: `Change of ${abs.toFixed(0)}% exceeds the ${policy.maxAutoChangePct}% policy limit.` };
  }
  return { risk: "MEDIUM", changePct, reason: `Change of ${abs.toFixed(0)}% is within policy.` };
}
