import { notFound } from "next/navigation";
import { CommercialJsonLd } from "@/components/system/CommercialJsonLd";
import { OsMarketingPage } from "@/components/system/OsMarketingPage";
import { getOsPage } from "@/lib/content/platform-os";
import { platformOsBreadcrumbs } from "@/lib/marketing-breadcrumbs";

export function OsMarketingRoute({ slug }: { slug: string }) {
  const content = getOsPage(slug);
  if (!content) notFound();
  const breadcrumbs = platformOsBreadcrumbs(content.name, content.slug);
  const path = `/platform/${slug}`;

  return (
    <>
      <CommercialJsonLd path={path} breadcrumbs={breadcrumbs} />
      <OsMarketingPage content={content} breadcrumbs={breadcrumbs} />
    </>
  );
}
