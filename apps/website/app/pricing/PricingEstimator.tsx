"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  INDUSTRY_PACKS,
  PRICING_PLANS,
  SERVICE_LAYERS,
  SHOPIFY_PACKAGES,
  type CommercialLayer,
} from "@/lib/content/commercialConfig";
import { trackMarketing } from "@/lib/analytics";

type Option = {
  id: string;
  label: string;
  priceLabel?: string;
  monthly: number;
  setup: number;
};

function optionFromLayer(layer: CommercialLayer): Option {
  return {
    id: layer.id,
    label: layer.name,
    priceLabel: layer.price,
    monthly: layer.estimate?.monthlyFrom ?? 0,
    setup: layer.estimate?.setupFrom ?? 0,
  };
}

function serviceLayer(id: string): CommercialLayer {
  const layer = SERVICE_LAYERS.find((item) => item.id === id);
  if (!layer) throw new Error(`Missing commercial service layer: ${id}`);
  return layer;
}

const industryOptions: Option[] = [
  { id: "none", label: "No industry pack yet", monthly: 0, setup: 0 },
  ...INDUSTRY_PACKS.map(optionFromLayer),
];

const shopifyOptions: Option[] = [
  { id: "none", label: "No Shopify package", monthly: 0, setup: 0 },
  ...SHOPIFY_PACKAGES.map(optionFromLayer),
];

const growthOptions: Option[] = [
  { id: "none", label: "No managed growth", monthly: 0, setup: 0 },
  optionFromLayer(serviceLayer("growth")),
];

const riOptions: Option[] = [
  { id: "included", label: "Use included RI allowance", monthly: 0, setup: 0 },
  optionFromLayer(serviceLayer("ri-credits")),
];

const implementationOptions: Option[] = [
  { id: "guided", label: "Core onboarding / guided", monthly: 0, setup: 0 },
  optionFromLayer(serviceLayer("implementation")),
];

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function findOption(options: Option[], id: string) {
  return options.find((option) => option.id === id) ?? options[0];
}

function optionLabel(option: Option) {
  return option.priceLabel ? `${option.label} — ${option.priceLabel}` : option.label;
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
      options: industryOptions.map((option) => ({ id: option.id, label: optionLabel(option) })),
    },
    {
      label: "Shopify / commerce implementation",
      value: shopifyId,
      onChange: setShopifyId,
      options: shopifyOptions.map((option) => ({ id: option.id, label: optionLabel(option) })),
    },
    {
      label: "Managed growth",
      value: growthId,
      onChange: setGrowthId,
      options: growthOptions.map((option) => ({ id: option.id, label: optionLabel(option) })),
    },
    {
      label: "RI Credits",
      value: riId,
      onChange: setRiId,
      options: riOptions.map((option) => ({ id: option.id, label: optionLabel(option) })),
    },
    {
      label: "Implementation",
      value: implementationId,
      onChange: setImplementationId,
      options: implementationOptions.map((option) => ({ id: option.id, label: optionLabel(option) })),
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
            <p className="text-sm text-muted-foreground">Recurring starting subtotal</p>
            <p className="mt-1 text-3xl font-black text-foreground">{money(estimate.monthly)}</p>
            <p className="mt-1 text-xs text-muted-foreground">per month before tax, usage and third-party costs</p>
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
          <div className="flex justify-between gap-4"><span>Implementation</span><span className="text-right">{estimate.implementation.label}</span></div>
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
          This calculator uses published starting anchors and is not a binding quotation. Usage-based RI Credits are
          scoped separately and are not included in the subtotal. Shopify plans, ad spend, payment fees, messaging,
          telephony, logistics and other third-party charges remain separate.
        </p>
      </aside>
    </div>
  );
}
