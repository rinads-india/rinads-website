import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RINADS WORK",
    short_name: "RINADS WORK",
    description:
      "Mobile business command centre for founders, operators and staff, powered by RINADS Intelligence and RINPO Runtime.",
    start_url: "/mobile",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6d28d9",
    orientation: "portrait-primary",
    categories: ["business", "productivity", "finance"],
  };
}
