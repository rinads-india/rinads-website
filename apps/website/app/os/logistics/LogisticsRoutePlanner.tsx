"use client";

import { useState, type FormEvent } from "react";
import type { LogisticsProviderReadiness } from "@/lib/logistics-os";

type PlannerResult = {
  title: string;
  message: string;
  matches: LogisticsProviderReadiness[];
  requiredCapabilities: string[];
};

const field =
  "min-h-11 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-gray-950 outline-none transition focus:border-rinads-primary focus:ring-2 focus:ring-rinads-primary/10";

function validPincode(value: string): boolean {
  return /^\d{6}$/.test(value);
}

export function LogisticsRoutePlanner({ providers }: { providers: LogisticsProviderReadiness[] }) {
  const [result, setResult] = useState<PlannerResult | null>(null);

  function evaluate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const pickup = String(data.get("pickup_pincode") ?? "").trim();
    const destination = String(data.get("destination_pincode") ?? "").trim();
    const weightGrams = Number(data.get("weight_grams") ?? 0);
    const requiredCapabilities = ["cod", "same_day", "high_value", "reverse"].filter(
      (capability) => data.get(capability) === "on"
    );

    if (!validPincode(pickup) || !validPincode(destination)) {
      setResult({
        title: "Check the route",
        message: "Pickup and destination must both be valid 6-digit Indian PIN codes.",
        matches: [],
        requiredCapabilities,
      });
      return;
    }

    if (!Number.isFinite(weightGrams) || weightGrams <= 0) {
      setResult({
        title: "Check the parcel",
        message: "Weight must be a positive number in grams before RI can evaluate carrier capability.",
        matches: [],
        requiredCapabilities,
      });
      return;
    }

    const capabilityMatches = providers.filter((provider) =>
      requiredCapabilities.every((capability) => provider.capabilities.includes(capability))
    );
    const liveMatches = capabilityMatches.filter((provider) => provider.liveVerified);

    if (liveMatches.length === 0) {
      setResult({
        title: "Intent valid — execution remains gated",
        message: `${capabilityMatches.length} registered provider${capabilityMatches.length === 1 ? "" : "s"} match the requested capabilities, but no verified live adapter is enabled. RINADS will not fabricate a rate, AWB or delivery promise.`,
        matches: capabilityMatches,
        requiredCapabilities,
      });
      return;
    }

    setResult({
      title: "Live capability match available",
      message: `${liveMatches.length} verified live provider${liveMatches.length === 1 ? "" : "s"} match this shipment intent. The next execution gate is server-side quote/serviceability evaluation through CourierProviderRouter before any booking is created.`,
      matches: liveMatches,
      requiredCapabilities,
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
      <form onSubmit={evaluate} className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-gray-700">
          Pickup PIN
          <input name="pickup_pincode" inputMode="numeric" maxLength={6} className={`${field} mt-1`} placeholder="641008" required />
        </label>
        <label className="text-xs font-medium text-gray-700">
          Destination PIN
          <input name="destination_pincode" inputMode="numeric" maxLength={6} className={`${field} mt-1`} placeholder="680004" required />
        </label>
        <label className="text-xs font-medium text-gray-700">
          Weight (grams)
          <input name="weight_grams" type="number" min="1" step="1" className={`${field} mt-1`} placeholder="500" required />
        </label>
        <label className="text-xs font-medium text-gray-700">
          RI routing objective
          <select name="strategy" defaultValue="intelligence" className={`${field} mt-1`}>
            <option value="intelligence">Intelligence — governed score</option>
            <option value="lowest_cost">Lowest cost</option>
            <option value="fastest">Fastest</option>
            <option value="priority">Tenant priority</option>
          </select>
        </label>

        <fieldset className="sm:col-span-2">
          <legend className="text-xs font-medium text-gray-700">Required capabilities</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              ["cod", "COD"],
              ["same_day", "Same day"],
              ["high_value", "High value"],
              ["reverse", "Reverse"],
            ].map(([name, label]) => (
              <label key={name} className="flex min-h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-xs font-medium text-gray-800">
                <input type="checkbox" name={name} className="h-4 w-4 accent-black" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="min-h-11 rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 sm:col-span-2">
          Evaluate shipment intent
        </button>
      </form>

      <div className="rounded-3xl border border-black/10 bg-gray-950 p-5 text-white">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">RINADS Intelligence gate</p>
        {result ? (
          <div className="mt-3">
            <h3 className="text-lg font-semibold">{result.title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-300">{result.message}</p>
            <div className="mt-4 space-y-2">
              {result.matches.map((provider) => (
                <div key={provider.key} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{provider.label}</span>
                    <span className="rounded-full border border-white/15 px-2 py-1 text-[10px] uppercase tracking-wide text-gray-300">
                      {provider.state.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{provider.role}</p>
                </div>
              ))}
              {result.matches.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-gray-400">
                  No registered provider matches every requested capability.
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <h3 className="text-lg font-semibold">Observe → Understand → Recommend → Authorize → Act → Audit</h3>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              This planner validates shipment intent against the capability registry. It deliberately stops before live rating or booking unless a carrier adapter has passed the production gate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
