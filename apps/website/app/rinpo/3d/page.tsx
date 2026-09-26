import type { Metadata } from "next";
import { Rinpo3DClient } from "./Rinpo3DClient";

export const metadata: Metadata = {
  title: "RINPO 3D Preview | RINADS",
  description: "Optional interactive RINPO preview. The existing RINPO assistant remains available.",
  robots: { index: false, follow: false },
};

export default function Rinpo3DPage() {
  return <Rinpo3DClient />;
}
