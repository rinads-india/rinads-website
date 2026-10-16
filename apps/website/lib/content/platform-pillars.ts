import { getProduct } from "@/lib/content/productCatalog";
import { getOsPage } from "@/lib/content/platform-os";

export function pillarBulletsFromOs(osSlug: string): string[] {
  const os = getOsPage(osSlug);
  if (!os) return [];
  return os.modules.map((module) =>
    module.description ? `${module.name} — ${module.description}` : module.name,
  );
}

export function pillarFromCatalog(slug: string) {
  const product = getProduct(slug);
  if (!product) return null;
  return product;
}
