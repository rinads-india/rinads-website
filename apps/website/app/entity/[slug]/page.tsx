import { createWebsiteServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type RiEntity = {
  title: string;
  description?: string | null;
  subtitle?: string | null;
  entity_type?: string | null;
  pillar?: string | null;
  tags?: string[] | null;
  href?: string | null;
  slug?: string | null;
  visibility?: string | null;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createWebsiteServerClient();
  const { data } = await supabase
    .from("ri_entities")
    .select("title, description")
    .eq("slug", slug)
    .eq("visibility", "public")
    .single();
  const entity = data as RiEntity | null;
  if (!entity) return { title: "Not Found" };
  return { title: `${entity.title} — RINADS`, description: entity.description ?? undefined };
}

export default async function EntityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createWebsiteServerClient();
  const { data } = await supabase
    .from("ri_entities")
    .select("*")
    .eq("slug", slug)
    .eq("visibility", "public")
    .single();

  const entity = data as RiEntity | null;
  if (!entity) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <nav className="text-sm text-gray-500 mb-8">
        <Link href="/search" className="hover:text-gray-900">Search</Link>
        <span className="mx-2">/</span>
        <span className="capitalize">{entity.entity_type}</span>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{entity.title}</span>
      </nav>

      <div className="mb-2">
        <span className="inline-block text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-600">
          {entity.entity_type}
        </span>
        {entity.pillar && (
          <span className="ml-2 inline-block text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
            {entity.pillar}
          </span>
        )}
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-2">{entity.title}</h1>
      {entity.subtitle && <p className="text-lg text-gray-600 mb-4">{entity.subtitle}</p>}
      {entity.description && <p className="text-gray-700 leading-relaxed mb-8">{entity.description}</p>}

      {entity.tags && entity.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {entity.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{tag}</span>
          ))}
        </div>
      )}

      {entity.href && entity.entity_type === "service" && (
        <Link
          href={entity.href}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          View Service →
        </Link>
      )}

      <div className="mt-12 pt-8 border-t border-gray-100">
        <Link href="/search" className="text-sm text-gray-500 hover:text-gray-900">← Back to Search</Link>
      </div>
    </main>
  );
}
