import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@rinads/cms";
import type { CmsSupabaseClient } from "@rinads/cms";
import { BlogPostEditor } from "@/components/cms/BlogPostEditor";
import { BlogPreviewLinkButton } from "@/components/cms/BlogPreviewLinkButton";
import { ToggleBlogPostStatusButton } from "@/components/cms/ToggleBlogPostStatusButton";
import { createPlatformServiceClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/supabase/env";

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

export default async function BlogPostEditPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(getClient(), slug, true);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/website/blog" className="text-sm text-rinads-primary hover:underline">
          ← Back to blog
        </Link>
        <h2 className="mt-2 text-2xl font-semibold">{post.title}</h2>
        <p className="text-sm text-muted-foreground">
          Slug: {post.slug} · Status: {post.status}
        </p>
      </div>

      <div className="card flex flex-wrap items-center gap-4">
        <ToggleBlogPostStatusButton slug={post.slug} status={post.status} />
        <BlogPreviewLinkButton slug={post.slug} />
      </div>

      <BlogPostEditor mode="edit" initial={post} />
    </div>
  );
}
