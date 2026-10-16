import type { BreadcrumbItem } from "@/components/system/Breadcrumbs";

export function platformOsBreadcrumbs(name: string, slug: string): BreadcrumbItem[] {
  return [
    { name: "Home", path: "/" },
    { name: "Platform", path: "/platform" },
    { name: name, path: `/platform/${slug}` },
  ];
}

export function solutionBreadcrumbs(name: string, slug: string): BreadcrumbItem[] {
  return [
    { name: "Home", path: "/" },
    { name: "Solutions", path: "/solutions" },
    { name: name, path: `/solutions/${slug}` },
  ];
}
