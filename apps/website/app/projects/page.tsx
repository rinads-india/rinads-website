import type { Metadata } from "next";
import { ProjectsClient } from "./ProjectsClient";

export const metadata: Metadata = {
  title: "Start a Project | RINADS",
  description:
    "Tell us about your vision. RINADS crafts bold ideas and ships them as products — websites, apps, commerce, and growth.",
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
