"use client";

import { useAuth } from "@/contexts/AuthContext";
import { getGreetingForHour } from "@/lib/os-rinpo-prompts";
import { getUserDisplayName } from "@/lib/user-display-name";

/**
 * Greeting only — attention metrics live in AttentionSummary / RINPO Daily Brief.
 */
export function OsDashboardHero() {
  const { user } = useAuth();
  const displayName = getUserDisplayName({
    displayName: user?.displayName,
    email: user?.email ?? user?.username,
  });
  const greeting = `${getGreetingForHour()}, ${displayName}.`;

  return (
    <section className="os-glass rounded-3xl p-5 sm:p-6" aria-label="Greeting">
      <p className="text-lg font-semibold text-gray-900 sm:text-xl">{greeting}</p>
      <p className="mt-1 text-sm text-gray-600">Here&apos;s what needs your attention today.</p>
    </section>
  );
}
