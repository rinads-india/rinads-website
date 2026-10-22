"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModuleSelectionGrid } from "@/components/onboarding/ModuleSelectionGrid";
import {
  BUSINESS_STAGES,
  BUSINESS_TYPE_GROUPS,
  EMPLOYEE_BANDS,
  REVENUE_BANDS,
  type BusinessTypeId,
  type OnboardingModuleId,
  resolveTemplateForBusinessType,
} from "@/lib/onboarding-config";
import { provisionOrganizationAction } from "@/app/onboarding/actions/onboarding";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selectedModules, setSelectedModules] = useState<OnboardingModuleId[]>([
    "customers",
    "projects",
  ]);
  const [businessType, setBusinessType] = useState<BusinessTypeId>("consulting");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessStage, setBusinessStage] = useState("growing");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [stateRegion, setStateRegion] = useState("");
  const [city, setCity] = useState("");
  const [employeeBand, setEmployeeBand] = useState("");
  const [annualRevenueBand, setAnnualRevenueBand] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(
        value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  }

  async function handleProvision() {
    setPending(true);
    setError(null);
    const result = await provisionOrganizationAction({
      name,
      slug,
      templateKey: resolveTemplateForBusinessType(businessType),
      selectedModules,
      businessType,
      businessDescription,
      businessStage,
      websiteUrl,
      countryCode,
      stateRegion,
      city,
      employeeBand,
      annualRevenueBand,
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const modulesParam = encodeURIComponent(selectedModules.join(","));
    router.push(
      `/onboarding/provisioning?orgId=${encodeURIComponent(result.organizationId)}&modules=${modulesParam}`
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Set up your RINADS Business OS</h1>
        <p className="mt-2 text-muted-foreground">Step {step} of 3</p>
      </div>

      {step === 1 && (
        <div className="space-y-4 rounded-xl border border-black/10 bg-white p-6">
          <div>
            <p className="text-sm font-medium">What do you want RINADS to help you manage?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with the capabilities you need. Your industry pack can add more later.
            </p>
          </div>
          <ModuleSelectionGrid selected={selectedModules} onChange={setSelectedModules} />
          <button
            type="button"
            disabled={selectedModules.length === 0}
            onClick={() => setStep(2)}
            className="rounded-md bg-[#9f4bc7] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 rounded-xl border border-black/10 bg-white p-6">
          <div>
            <p className="text-sm font-medium">Tell RINPO about your business</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose the closest industry now. The registry supports multi-industry classification as it evolves.
            </p>
          </div>

          <label className="block space-y-1 text-sm">
            <span>What your business does</span>
            <textarea
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              rows={4}
              placeholder="Example: We run a jewellery showroom and online store selling gold, silver and diamond jewellery."
              className="w-full rounded border px-3 py-2"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Primary industry</span>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as BusinessTypeId)}
              className="w-full rounded border bg-white px-3 py-2"
            >
              {BUSINESS_TYPE_GROUPS.map((group) => (
                <optgroup key={group.id} label={group.label}>
                  {group.industries.map((industry) => (
                    <option key={industry.id} value={industry.id}>
                      {industry.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="rounded-lg bg-black/[0.03] p-3 text-sm text-muted-foreground">
            Provisioning profile: <span className="font-medium text-foreground">{resolveTemplateForBusinessType(businessType)}</span>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="rounded-md border px-4 py-2 text-sm">
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-md bg-[#9f4bc7] px-4 py-2 text-sm font-medium text-white"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 rounded-xl border border-black/10 bg-white p-6">
          <label className="block space-y-1 text-sm">
            <span>Organization name</span>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full rounded border px-3 py-2"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Website</span>
            <input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yourcompany.com"
              inputMode="url"
              className="w-full rounded border px-3 py-2"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Workspace slug</span>
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              required
              placeholder="my-business"
              className="w-full rounded border px-3 py-2"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Business stage</span>
            <select value={businessStage} onChange={(e) => setBusinessStage(e.target.value)} className="w-full rounded border bg-white px-3 py-2">
              {BUSINESS_STAGES.map((stage) => (
                <option key={stage.id} value={stage.id}>{stage.label}</option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span>Country</span>
              <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-full rounded border bg-white px-3 py-2">
                <option value="IN">India</option>
                <option value="AE">United Arab Emirates</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="SG">Singapore</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span>State / Province</span>
              <input value={stateRegion} onChange={(e) => setStateRegion(e.target.value)} className="w-full rounded border px-3 py-2" />
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span>City</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded border px-3 py-2" />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span>Number of employees</span>
              <select value={employeeBand} onChange={(e) => setEmployeeBand(e.target.value)} className="w-full rounded border bg-white px-3 py-2">
                <option value="">Select</option>
                {EMPLOYEE_BANDS.map((band) => <option key={band} value={band}>{band}</option>)}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span>Annual revenue</span>
              <select value={annualRevenueBand} onChange={(e) => setAnnualRevenueBand(e.target.value)} className="w-full rounded border bg-white px-3 py-2">
                <option value="">Select</option>
                {REVENUE_BANDS.map((band) => <option key={band} value={band}>{band}</option>)}
              </select>
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)} className="rounded-md border px-4 py-2 text-sm">
              Back
            </button>
            <button
              type="button"
              disabled={pending || !name || !slug}
              onClick={() => void handleProvision()}
              className="rounded-md bg-[#9f4bc7] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {pending ? "Creating…" : "Create Business OS"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
