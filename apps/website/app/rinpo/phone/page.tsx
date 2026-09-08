import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { RinpoChannelPage } from "../RinpoChannelPage";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/rinpo/phone");
}

export default function Page() {
  return (
    <RinpoChannelPage
      eyebrow="RINPO Phone"
      headline="AI phone agent for real conversations."
      summary="Handle calls, follow-ups, and business conversations through RINPO — with audit and human approval where it matters."
      channel="Phone"
    />
  );
}
