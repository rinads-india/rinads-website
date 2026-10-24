import type { Metadata } from "next";
import { Suspense } from "react";
import OAuthConsentClient from "@/components/auth/OAuthConsentClient";

export const metadata: Metadata = {
  title: "Authorize RINADS Intelligence | RINADS",
  description: "Review and authorize secure access to your RINADS account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OAuthConsentPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black" />}>
      <OAuthConsentClient />
    </Suspense>
  );
}
