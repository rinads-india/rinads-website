"use client";

import { ONBOARDING_MODULES, type OnboardingModuleId } from "@/lib/onboarding-config";

type ModuleSelectionGridProps = {
  selected: OnboardingModuleId[];
  onChange: (modules: OnboardingModuleId[]) => void;
};

export function ModuleSelectionGrid({ selected, onChange }: ModuleSelectionGridProps) {
  function toggle(id: OnboardingModuleId) {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ONBOARDING_MODULES.map((module) => {
        const active = selected.includes(module.id);
        return (
          <button
            key={module.id}
            type="button"
            onClick={() => toggle(module.id)}
            className={`rounded-xl border p-4 text-left transition ${
              active
                ? "border-rinads-primary bg-rinads-primary/5 ring-2 ring-rinads-primary/30"
                : "border-black/10 bg-white hover:border-rinads-primary/30"
            }`}
          >
            <p className="font-semibold text-foreground">{module.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
          </button>
        );
      })}
    </div>
  );
}
