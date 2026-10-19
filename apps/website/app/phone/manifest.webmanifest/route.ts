import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const manifest = {
    id: "/phone",
    name: "RINPO Phone",
    short_name: "RINPO",
    description: "RINADS intelligent business interface — web app alpha.",
    start_url: "/phone?source=pwa",
    scope: "/phone",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0B0B0B",
    theme_color: "#0B0B0B",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/assets/rinads-logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Today",
        short_name: "Today",
        url: "/phone?screen=today&source=shortcut",
      },
      {
        name: "Ask RINPO",
        short_name: "RINPO",
        url: "/phone?screen=ask&source=shortcut",
      },
      {
        name: "RINADS WORLD",
        short_name: "World",
        url: "/phone?screen=world&source=shortcut",
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
