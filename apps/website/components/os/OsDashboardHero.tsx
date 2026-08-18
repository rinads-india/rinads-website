"use client";

import { useRinpoMemory } from "@/hooks/useRinpoMemory";
import { useAuth } from "@/contexts/AuthContext";
import { getGreetingForHour } from "@/lib/os-rinpo-prompts";

type OsDashboardHeroProps = {
  onAskRinpo: (prompt: string) => void;
};

export function OsDashboardHero({ onAskRinpo }: OsDashboardHeroProps) {
  const { user } = useAuth();
  const { getPersonalizedGreeting } = useRinpoMemory();
  const displayName = user?.username?.split("@")[0] ?? user?.username ?? "there";
  const greeting = getPersonalizedGreeting() || `${getGreetingForHour()}, ${displayName}`;

  return (
    <section className="os-glass rounded-3xl p-5 sm:p-6">
      <p className="text-lg font-semibold text-gray-900 sm:text-xl">{greeting}</p>
      <p className="mt-1 text-sm text-gray-600">Here&apos;s what needs your attention today.</p>
      <p className="mt-3 text-sm font-medium text-gray-800">
        2 projects in review · 3 tasks due · 12 new leads
      </p>
      <div className="mt-5 border-t border-gray-200/80 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-rinads-primary">
          Ask RINPO
        </p>
        <button
          type="button"
          onClick={() => onAskRinpo("What should I focus on today?")}
          className="mt-2 text-left text-sm font-medium text-gray-800 underline-offset-2 hover:text-rinads-primary hover:underline"
        >
          &quot;What should I focus on today?&quot;
        </button>
      </div>
    </section>
  );
}
