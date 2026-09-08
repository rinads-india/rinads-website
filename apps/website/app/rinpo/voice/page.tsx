import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { RinpoChannelPage } from "../RinpoChannelPage";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/rinpo/voice");
}

export default function Page() {
  return (
    <RinpoChannelPage
      eyebrow="RINPO Voice"
      headline="Speak with your business interface."
      summary="RINPO voice agents let teams talk to the operating platform — ask, instruct, and operate hands-free."
      channel="Voice"
    />
  );
}
