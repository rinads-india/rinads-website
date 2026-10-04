import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageShell, PageHero } from "@/components/system";
import { getBlogIndex, getPageMetadata } from "@/lib/cms";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/blog");
}

export default async function BlogIndexPage() {
  const posts = await getBlogIndex();

  return (
    <MarketingPageShell>
      <PageHero
        eyebrow="Blog"
        headline="Notes from building the operating platform."
        summary="Product thinking, platform updates, and operating-model notes from the team building RINADS."
      />
      <section className="px-6 pb-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-5xl">
          {posts.length === 0 ? (
            <div className="border border-white/10 p-8">
              <h2 className="text-xl font-bold text-foreground">No posts published yet</h2>
              <p className="mt-3 text-muted-foreground">
                We publish posts when they are ready. Check back soon.
              </p>
            </div>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="group flex flex-col border border-white/10 p-6 transition hover:border-rinads-primary/50"
                >
                  {post.tags.length > 0 ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">
                      {post.tags.join(" · ")}
                    </p>
                  ) : null}
                  <h2 className="mt-3 text-2xl font-bold text-foreground">
                    <Link href={`/blog/${post.slug}`} className="group-hover:text-rinads-primary">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-3 flex-1 text-muted-foreground">{post.excerpt}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-6 inline-flex text-sm font-semibold text-rinads-primary hover:underline"
                  >
                    Read post →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </MarketingPageShell>
  );
}
