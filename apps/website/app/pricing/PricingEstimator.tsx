"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PRICING_PLANS } from "@/lib/content/commercialConfig";
import { trackMarketing } from "@/lib/analytics";

type Option = {
  id: string;
  label: string;
  monthly: number;
  setup: number;
};

const industryOptions: Option[] = [
  { id: "none", label: "No industry pack yet", monthly: 0, setup: 0 },
  { id: "salon", label: "Salon / R GLOW", monthly: 1499, setup: 0 },
  { id: "retail", label: "Retail", monthly: 2999, setup: 0 },
  { id: "landscape", label: "Landscape / Nursery", monthly: 3999, setup: 0 },
  { id: "jewellery", label: "Jewellery", monthly: 9999, setup: 0 },
  { id: "automotive", label: "Automotive", monthly: 9999, setup: 0 },
  { id: "logistics", label: "Logistics", monthly: 14999, setup: 0 },
];

const shopifyOptions: Option[] = [
  { id: "none", label: "No Shopify package", monthly: 0, setup: 0 },
  { id: "launch", label: "Commerce Launch", monthly: 3999, setup: 49999 },
  { id: "growth", label: "Commerce Growth", monthly: 9999, setup: 99999 },
  { id: "intelligence", label: "Commerce Intelligence", monthly: 19999, setup: 200000 },
  { id: "enterprise", label: "Commerce Enterprise", monthly: 50000, setup: 500000 },
];

const growthOptions: Option[] = [
  { id: "none", label: "No managed growth", monthly: 0, setup: 0 },
  { id: "start", label: "Growth Start", monthly: 15000, setup: 0 },
  { id: "engine", label: "Growth Engine", monthly: 30000, setup: 0 },
  { id: "scale", label: "Growth Scale", monthly: 60000, setup: 0 },
  { id: "department", label: "Growth Department", monthly: 125000, setup: 0 },
];

const riOptions: Option[] = [
  { id: "included", label: "Use included RI allowance", monthly: 0, setup: 0 },
  { id: "1k", label: "RI 1K top-up", monthly: 499, setup: 0 },
  { id: "5k", label: "RI 5K top-up", monthly: 1999, setup: 0 },
  { id: "20k", label: "RI 20K top-up", monthly: 5999, setup: 0 },
  { id: "50k", label: "RI 50K top-up", monthly: 11999, setup: 0 },
];

const implementationOptions: Option[] = [
  { id: "guided", label: "Core onboarding / guided", monthly: 0, setup: 0 },
  { id: "standard", label: "Standard implementation", monthly: 0, setup: 25000 },
  { id: "advanced", label: "Advanced implementation", monthly: 0, setup: 75000 },
  { id: "transformation", label: "Vertical transformation", monthly: 0, setup: 200000 },
  { id: "enterprise", label: "Enterprise implementation", monthly: 0, setup: 500000 },
];

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function findOption(options: Option[], id: string) {
  return options.find((option) => option.id === id) ?? options[0];
}

export function PricingEstimator() {
  const [planId, setPlanId] = useState("grow");
  const [industryId, setIndustryId] = useState("none");
  const [shopifyId, setShopifyId] = useState("none");
  const [growthId, setGrowthId] = useState("none");
  const [riId, setRiId] = useState("included");
  const [implementationId, setImplementationId] = useState("guided");

  const estimate = useMemo(() => {
    const plan = PRICING_PLANS.find((item) => item.id === planId) ?? PRICING_PLANS[1];
    const planMonthly = typeof plan.monthlyPrice === "number" ? plan.monthlyPrice : 0;
    const industry = findOption(industryOptions, industryId);
    const shopify = findOption(shopifyOptions, shopifyId);
    const growth = findOption(growthOptions, growthId);
    const ri = findOption(riOptions, riId);
    const implementation = findOption(implementationOptions, implementationId);

    return {
      plan,
      monthly: planMonthly + industry.monthly + shopify.monthly + growth.monthly + ri.monthly,
      setup: industry.setup + shopify.setup + implementation.setup,
      industry,
      shopify,
      growth,
      ri,
      implementation,
    };
  }, [planId, industryId, shopifyId, growthId, riId, implementationId]);

  const contactHref = useMemo(() => {
    const params = new URLSearchParams({
      intent: "sales",
      flow: "pricing-estimate",
      plan: planId,
      industry: industryId,
      shopify: shopifyId,
      growth: growthId,
      ri: riId,
      implementation: implementationId,
      recurring: String(estimate.monthly),
      setup: String(estimate.setup),
    });
    return `/contact?${params.toString()}`;
  }, [planId, industryId, shopifyId, growthId, riId, implementationId, estimate.monthly, estimate.setup]);

  const selects = [
    {
      label: "RINADS plan",
      value: planId,
      onChange: setPlanId,
      options: PRICING_PLANS.map((plan) => ({
        id: plan.id,
        label:
          typeof plan.monthlyPrice === "number"
            ? `${plan.name} — ${money(plan.monthlyPrice)}/mo`
            : plan.name,
      })),
    },
    {
      label: "Industry pack",
      value: industryId,
      onChange: setIndustryId,
      options: industryOptions.map(({ id, label, monthly }) => ({
        id,
        label: monthly ? `${label} — from ${money(monthly)}/mo` : label,
      })),
    },
    {
      label: "Shopify / commerce implementation",
      value: shopifyId,
      onChange: setShopifyId,
      options: shopifyOptions.map(({ id, label, monthly, setup }) => ({
        id,
        label:
          monthly || setup
            ? `${label} — ${money(setup)} setup + ${money(monthly)}/mo`
            : label,
      })),
    },
    {
      label: "Managed growth",
      value: growthId,
      onChange: setGrowthId,
      options: growthOptions.map(({ id, label, monthly }) => ({
        id,
        label: monthly ? `${label} — ${money(monthly)}/mo` : label,
      })),
    },
    {
      label: "RI Credits",
      value: riId,
      onChange: setRiId,
      options: riOptions.map(({ id, label, monthly }) => ({
        id,
        label: monthly ? `${label} — ${money(monthly)}` : label,
      })),
    },
    {
      label: "Implementation",
      value: implementationId,
      onChange: setImplementationId,
      options: implementationOptions.map(({ id, label, setup }) => ({
        id,
        label: setup ? `${label} — from ${money(setup)}` : label,
      })),
    },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="grid gap-5 sm:grid-cols-2">
        {selects.map((field) => (
          <label key={field.label} className="block">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {field.label}
            </span>
            <select
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              className="min-h-12 w-full border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none transition focus:border-rinads-primary/60"
            >
              {field.options.map((option) => (
                <option key={option.id} value={option.id} className="bg-background text-foreground">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <aside className="border border-rinads-primary/40 bg-rinads-primary/5 p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">
          Indicative estimate
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Recurring subtotal</p>
            <p className="mt-1 text-3xl font-black text-foreground">{money(estimate.monthly)}</p>
            <p className="mt-1 text-xs text-muted-foreground">per month before tax and third-party costs</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">One-time starting subtotal</p>
            <p className="mt-1 text-3xl font-black text-foreground">{money(estimate.setup)}</p>
            <p className="mt-1 text-xs text-muted-foreground">subject to discovery and final scope</p>
          </div>
        </div>

        <div className="mt-7 space-y-2 border-t border-white/10 pt-5 text-sm text-muted-foreground">
          <div className="flex justify-between gap-4"><span>Platform</span><span>{estimate.plan.name}</span></div>
          <div className="flex justify-between gap-4"><span>Industry</span><span className="text-right">{estimate.industry.label}</span></div>
          <div className="flex justify-between gap-4"><span>Commerce</span><span className="text-right">{estimate.shopify.label}</span></div>
          <div className="flex justify-between gap-4"><span>Growth</span><span className="text-right">{estimate.growth.label}</span></div>
          <div className="flex justify-between gap-4"><span>RI usage</span><span className="text-right">{estimate.ri.label}</span></div>
        </div>

        <Link
          href={contactHref}
          onClick={() =>
            trackMarketing("pricing_estimate_started", {
              source: "pricing_estimator",
              plan: planId,
              recurring: estimate.monthly,
              setup: estimate.setup,
            })
          }
          className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-rinads-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-rinads-primary-dark"
        >
          Get configured proposal
        </Link>

        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          This calculator provides a starting commercial estimate, not a binding quotation. Shopify plans, ad spend,
          payment fees, messaging, telephony, logistics and other third-party charges remain separate.
        </p>
      </aside>
    </div>
  );
}
