import type { Metadata } from "next";
import { ProjectsClient } from "./ProjectsClient";
import { getPageMetadata } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/projects");
}

export default function ProjectsPage() {
  return <ProjectsClient />;
}
