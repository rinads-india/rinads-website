import type { Metadata, Viewport } from "next";
import { PhoneAppClient } from "./PhoneAppClient";

export const metadata: Metadata = {
  title: "RINPO Phone | RINADS",
  description:
    "Installable RINPO Phone web-app alpha for accessing RINPO, workspaces, RINADS WORLD and governed RINADS tools.",
  manifest: "/phone/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RINPO Phone",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0B0B0B",
};

export default function PhonePage() {
  return <PhoneAppClient />;
}
