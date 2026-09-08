import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/cms";
import { CompanyClient } from "./CompanyClient";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("/company");
}

export default function CompanyPage() {
  return <CompanyClient />;
}
