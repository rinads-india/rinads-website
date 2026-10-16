import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UseCaseStubPage } from "@/components/system/UseCaseStubPage";
import { getUseCase } from "@/lib/content/use-cases";
import { metadataFromRegistry } from "@/lib/route-registry";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const path = `/use-cases/${slug}`;
  const fromRegistry = metadataFromRegistry(path);
  if (fromRegistry) return fromRegistry as Metadata;
  const useCase = getUseCase(slug);
  if (!useCase) return { title: "Use case | RINADS" };
  return { title: `${useCase.title} | RINADS`, description: useCase.summary };
}

export default async function UseCaseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const useCase = getUseCase(slug);
  if (!useCase) notFound();

  return (
    <UseCaseStubPage
      slug={useCase.slug}
      title={useCase.title}
      summary={useCase.summary}
      outcomes={useCase.outcomes}
      platformHref={useCase.platformHref}
      platformLabel={useCase.platformLabel}
    />
  );
}
