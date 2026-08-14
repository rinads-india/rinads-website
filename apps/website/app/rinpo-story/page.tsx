import type { Metadata } from "next";
import { RinpoStoryClient } from "./RinpoStoryClient";

export const metadata: Metadata = {
  title: "RINPO — The Awakening of Intelligence | RINADS",
  description:
    "World's First Business Intelligence Character. Born with a gift. Awakened under a banyan tree. Built by RINADS to make every business think, speak and grow.",
};

export default function RinpoStoryPage() {
  return <RinpoStoryClient />;
}
