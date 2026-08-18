"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ModuleSelectionGrid } from "@/components/onboarding/ModuleSelectionGrid";
import {
  BUSINESS_TYPES,
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
  const [businessType, setBusinessType] = useState<BusinessTypeId>("agency");
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
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold">Let&apos;s set up your business workspace</h1>
        <p className="mt-2 text-muted-foreground">Step {step} of 3</p>
      </div>

      {step === 1 && (
        <div className="space-y-4 rounded-xl border border-black/10 bg-white p-6">
          <p className="text-sm font-medium">What do you want RINADS to help you manage?</p>
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
          <p className="text-sm font-medium">What type of business do you run?</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {BUSINESS_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setBusinessType(type.id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                  businessType === type.id
                    ? "border-rinads-primary bg-rinads-primary/5 font-semibold"
                    : "border-black/10 hover:border-rinads-primary/30"
                }`}
              >
                {type.label}
              </button>
            ))}
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
            <span>Slug</span>
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
              {pending ? "Creating…" : "Create workspace"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
