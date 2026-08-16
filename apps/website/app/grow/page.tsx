import type { Metadata } from "next";
import { GrowClient } from "./GrowClient";

export const metadata: Metadata = {
  title: "RINADS Grow — Marketing That Scales With Intelligence",
  description:
    "RINADS Grow is RINADS' digital marketing platform — SEO, paid media, and social growth you browse on the web, buy through RINADS, and manage inside Business OS.",
  openGraph: {
    title: "RINADS Grow — Marketing That Scales With Intelligence",
    description:
      "Browse SEO, paid media, and social growth packages. Launch campaigns through RINADS and manage them in Business OS.",
  },
};

export default function GrowPage() {
  return <GrowClient />;
}
