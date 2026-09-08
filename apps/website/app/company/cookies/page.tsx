import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { LegalPage } from "@/components/system";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/company/cookies");
}

export default function CookiePolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Cookie Policy"
      intro="How RINADS uses cookies and similar technologies on the public website and platform."
      sections={[
        {
          heading: "Why we use cookies",
          body: [
            "Cookies keep you signed in, remember preferences, and help us understand how the RINADS website and platform are used so we can improve them.",
          ],
        },
        {
          heading: "Types of cookies",
          body: [
            "Essential cookies required for authentication and core functionality.",
            "Analytics cookies used to understand aggregate usage patterns, where enabled.",
          ],
        },
        {
          heading: "Managing cookies",
          body: [
            "Most browsers let you control cookies through their settings. Disabling essential cookies may prevent sign-in and core platform features from working.",
          ],
        },
        {
          heading: "Contact",
          body: ["Questions about this policy can be sent through the Company contact page."],
        },
      ]}
    />
  );
}
