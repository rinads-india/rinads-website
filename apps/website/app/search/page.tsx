import type { Metadata } from "next";
import { RISearchClient } from "./RISearchClient";

export const metadata: Metadata = {
  title: "RI Search — RINADS",
  description: "Discover RINADS services, industry solutions, and WORLD places.",
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function RISearchPage({ searchParams }: Props) {
  const params = await searchParams;
  return <RISearchClient initialQuery={params.q ?? ""} />;
}
