"use client";

import { useSearchParams } from "next/navigation";
import { LeadForm } from "@/components/system/LeadForm";

export function ContactClient() {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent") ?? undefined;
  const plan = searchParams.get("plan") ?? undefined;
  const source = searchParams.get("source");
  const sourcePath = source === "start" ? "/start" : "/contact";

  return (
    <LeadForm
      defaultIntent={intent}
      defaultPlan={plan}
      sourcePath={sourcePath}
      heading={
        intent === "demo"
          ? "Book a demo"
          : intent === "audit"
            ? "Request your free Business Simplified Audit"
            : intent === "sales"
              ? "Talk to sales"
              : intent === "implementation"
                ? "Talk to an implementation specialist"
                : intent === "security"
                  ? "Security enquiry"
                  : intent === "partner"
                    ? "Partner with RINADS"
                    : "What are you trying to achieve?"
      }
    />
  );
}
