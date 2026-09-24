"use client";

import { useSearchParams } from "next/navigation";
import { LeadForm } from "@/components/system/LeadForm";

export function ContactClient() {
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent") ?? undefined;
  const plan = searchParams.get("plan") ?? undefined;

  return (
    <LeadForm
      defaultIntent={intent}
      defaultPlan={plan}
      sourcePath="/contact"
      heading={
        intent === "demo"
          ? "Book a platform demo"
          : intent === "sales"
            ? "Talk to sales"
            : intent === "implementation"
              ? "Talk to an implementation specialist"
              : intent === "security"
                ? "Security enquiry"
                : "What are you trying to achieve?"
      }
    />
  );
}
