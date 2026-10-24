import Link from "next/link";
import { notFound } from "next/navigation";
import { getDefaultAbout, getDefaultServiceCards, getPageBySlug } from "@rinads/cms";
import { PageSectionEditor } from "@/components/cms/PageSectionEditor";
import { createPlatformServiceClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/env";
import type { CmsSupabaseClient } from "@rinads/cms";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const LEGACY_HOME_SERVICE_TITLES = [
  "Digital Marketing",
  "Custom Software Development",
  "AI Automation",
];

function isLegacyHomeServices(value: unknown): boolean {
  if (!Array.isArray(value) || value.length !== LEGACY_HOME_SERVICE_TITLES.length) return false;
  return LEGACY_HOME_SERVICE_TITLES.every((title, index) => {
    const item = value[index];
    return Boolean(item && typeof item === "object" && "title" in item && item.title === title);
  });
}

function isLegacyHomeAbout(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const body = "body" in value ? value.body : undefined;
  return typeof body === "string" && body.includes("software and growth company");
}

function normalizeLegacyHomeSections(slug: string, sections: Record<string, unknown>) {
  if (slug !== "home") return sections;

  return {
    ...sections,
    ...(isLegacyHomeServices(sections["services.cards"])
      ? { "services.cards": getDefaultServiceCards() }
      : {}),
    ...(isLegacyHomeAbout(sections.about) ? { about: getDefaultAbout() } : {}),
  };
}

function getClient(): CmsSupabaseClient | null {
  if (isDemoMode()) return null;
  try {
    return createPlatformServiceClient() as unknown as CmsSupabaseClient;
  } catch {
    return null;
  }
}

export default async function WebsitePageEditPage({ params }: PageProps) {
  const { slug } = await params;
  const client = getClient();
  const page = await getPageBySlug(client, slug, true);
  if (!page) notFound();

  const normalizedSections = normalizeLegacyHomeSections(slug, page.sections);
  const sections = Object.entries(normalizedSections);
  const editableSections =
    sections.length > 0
      ? sections
      : slug === "home"
        ? ([
            ["services.cards", normalizedSections["services.cards"] ?? getDefaultServiceCards()],
            ["about", normalizedSections.about ?? getDefaultAbout()],
          ] as [string, unknown][])
        : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/website/pages" className="text-sm text-rinads-primary hover:underline">
          ← Back to pages
        </Link>
        <h2 className="mt-2 text-2xl font-semibold">{page.title}</h2>
        <p className="text-sm text-muted-foreground">Slug: {page.slug} · Status: {page.status}</p>
      </div>

      <div className="space-y-8">
        {editableSections.map(([sectionKey, content]) => (
          <PageSectionEditor
            key={sectionKey}
            slug={slug}
            sectionKey={sectionKey}
            initialJson={JSON.stringify(content, null, 2)}
          />
        ))}
        {editableSections.length === 0 ? (
          <p className="text-sm text-muted-foreground">No editable sections yet for this page.</p>
        ) : null}
      </div>
    </div>
  );
}
