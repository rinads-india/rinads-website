import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeoByPath } from "@rinads/cms";
import { SeoEditorForm } from "@/components/cms/SeoEditorForm";
import { createPlatformServiceClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/env";
import type { CmsSupabaseClient } from "@rinads/cms";

type PageProps = {
  params: Promise<{ path: string }>;
};

function getClient(): CmsSupabaseClient | null {
  if (isDemoMode()) return null;
  try {
    return createPlatformServiceClient() as unknown as CmsSupabaseClient;
  } catch {
    return null;
  }
}

export default async function WebsiteSeoEditPage({ params }: PageProps) {
  const { path: encoded } = await params;
  const path = encoded === "root" ? "/" : `/${encoded}`;
  const seo = await getSeoByPath(getClient(), path);
  if (!seo) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/website/seo" className="text-sm text-rinads-primary hover:underline">
          ← Back to SEO
        </Link>
        <h2 className="mt-2 text-2xl font-semibold">Edit SEO · {path}</h2>
      </div>
      <SeoEditorForm initial={seo} />
    </div>
  );
}
