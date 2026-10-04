import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingPageShell } from "@/components/system";
import { getBlogPost } from "@/lib/cms";
import { resolvePreview } from "@/lib/cms-preview";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string | string[] }>;
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.rinads.com";

function firstPreviewToken(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function generateMetadata({
  params,
  searchParams,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const path = `/blog/${slug}`;
  const token = firstPreviewToken((await searchParams).preview);
  const preview = resolvePreview({ token, path }).previewing;

  const post = await getBlogPost(slug, { preview });
  if (!post) {
    return { title: "Post not found | RINADS", robots: { index: false, follow: false } };
  }

  const canonical = `${siteUrl}${path}`;
  // Drafts shown via preview must never be indexed.
  const index = post.status === "published" && !preview;
  return {
    title: `${post.title} | RINADS`,
    description: post.excerpt,
    alternates: { canonical },
    robots: { index, follow: index },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: canonical,
      siteName: "RINADS",
      type: "article",
      ...(post.coverImageUrl ? { images: [{ url: post.coverImageUrl }] } : {}),
    },
  };
}

export default async function BlogPostPage({ params, searchParams }: BlogPostPageProps) {
  const { slug } = await params;
  const path = `/blog/${slug}`;
  const token = firstPreviewToken((await searchParams).preview);
  const preview = resolvePreview({ token, path }).previewing;

  const post = await getBlogPost(slug, { preview });
  // Published posts render normally; drafts only render with a valid preview
  // token. Everything else (unknown slug, draft without a token) 404s.
  if (!post) notFound();

  const isDraftPreview = preview && post.status !== "published";
  const paragraphs = post.body.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <MarketingPageShell>
      <article className="px-6 pb-24 pt-28 md:px-12 md:pt-36 lg:px-20">
        <div className="mx-auto max-w-3xl">
          {isDraftPreview ? (
            <div
              className="mb-8 rounded-md border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
              role="status"
            >
              Draft preview — this post is unpublished and is not indexed by search engines.
            </div>
          ) : null}
          <Link href="/blog" className="text-sm font-semibold text-rinads-primary hover:underline">
            ← All posts
          </Link>
          {post.tags.length > 0 ? (
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">
              {post.tags.join(" · ")}
            </p>
          ) : null}
          <h1 className="mt-3 text-4xl font-black leading-[1.1] tracking-tight text-foreground md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">{post.excerpt}</p>
          <div className="mt-10 space-y-6 text-base leading-relaxed text-foreground/90">
            {paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
    </MarketingPageShell>
  );
}
