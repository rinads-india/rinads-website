import "server-only";
import { unstable_cache } from "next/cache";
import { loadEngineeringFacts, parseVercelProjects } from "@rinads/company-os-server";

/**
 * Engineering signals, cached for 60s so a busy /os does not hammer GitHub/Vercel.
 * All credentials are READ-ONLY tokens supplied through server environment variables; any that are
 * missing simply read "not connected". The cached value contains no secrets.
 */
export const getEngineeringFacts = unstable_cache(
  async () =>
    loadEngineeringFacts({
      github: { token: process.env.COMPANY_OS_GITHUB_TOKEN, repository: process.env.COMPANY_OS_GITHUB_REPO ?? "rinads-india/rinads-website" },
      vercel: { token: process.env.COMPANY_OS_VERCEL_TOKEN, teamId: process.env.COMPANY_OS_VERCEL_TEAM_ID, projects: parseVercelProjects(process.env.COMPANY_OS_VERCEL_PROJECTS) },
      supabase: { url: process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    }),
  ["company-os-engineering-facts-v1"],
  { revalidate: 60 }
);
