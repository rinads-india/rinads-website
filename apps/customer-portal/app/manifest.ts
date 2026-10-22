import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RINADS ONE",
    short_name: "RINADS ONE",
    description:
      "One customer identity for commerce, services, loyalty, support and RINPO-powered assistance across RINADS businesses.",
    start_url: "/mobile",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6d28d9",
    orientation: "portrait-primary",
    categories: ["business", "shopping", "productivity"],
  };
}
