import Link from "next/link";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@rinads/cms";
import { PageSectionEditor } from "@/components/cms/PageSectionEditor";
import { createPlatformServiceClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/env";
import type { CmsSupabaseClient } from "@rinads/cms";

type PageProps = {
  params: Promise<{ slug: string }>;
};

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

  const sections = Object.entries(page.sections);
  const editableSections =
    sections.length > 0
      ? sections
      : slug === "home"
        ? ([
            ["services.cards", page.sections["services.cards"] ?? []],
            ["about", page.sections.about ?? {}],
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
