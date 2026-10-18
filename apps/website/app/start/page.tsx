import type { Metadata } from "next";
import { Suspense } from "react";
import { MarketingPageShell } from "@/components/system";
import { COMPANY_CONFIG } from "@/lib/content/companyConfig";
import { StartClient } from "./StartClient";

const TITLE = "Start with RINADS | Business Simplified";
const DESCRIPTION =
  "Choose the fastest path into RINADS: a free Business Simplified Audit, a 30-minute industry demo, RINPO, Academy, industry solutions, or a conversation with the team.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/start" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${COMPANY_CONFIG.siteUrl}/start`,
    type: "website",
  },
};

export default function StartPage() {
  return (
    <MarketingPageShell>
      <Suspense
        fallback={
          <main className="px-6 pb-24 pt-28 md:px-12 lg:px-20">
            <div className="mx-auto max-w-7xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-muted-foreground">
              Loading RINADS start paths…
            </div>
          </main>
        }
      >
        <StartClient whatsappUrl={COMPANY_CONFIG.contact.whatsappUrl} />
      </Suspense>
    </MarketingPageShell>
  );
}
