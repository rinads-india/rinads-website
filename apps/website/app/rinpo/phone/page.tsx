import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { PhoneClient } from "./PhoneClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/rinpo/phone");
}

export default function Page() {
  return <PhoneClient />;
}
