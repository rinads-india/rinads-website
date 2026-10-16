import "server-only";
import { cache } from "react";
import { buildFounderSnapshot, can, type CompanyFacts, type FounderSnapshot } from "@rinads/company-os";
import { loadCompanyFacts } from "@rinads/company-os-server";
import { getEngineeringFacts } from "./engineering";
import { getCompanyOsSession } from "./session";

export type CompanyData =
  | { kind: "demo" }
  | { kind: "no-org" }
  | {
      kind: "ready";
      session: Extract<Awaited<ReturnType<typeof getCompanyOsSession>>, { kind: "ready" }>;
      facts: CompanyFacts;
      snapshot: FounderSnapshot;
      notes: string[];
      now: Date;
    };

/** Facts + founder snapshot for the caller, memoised per request. Permission filtering happens inside RLS + the loader. */
export const loadCompanyData = cache(async (path: string = "/os"): Promise<CompanyData> => {
  const session = await getCompanyOsSession(path);
  if (session.kind !== "ready") return session;
  const now = new Date();
  const engineering = can(session.ctx, "engineering.read") ? await getEngineeringFacts() : undefined;
  const { facts, notes } = await loadCompanyFacts({ db: session.db, ctx: session.ctx, organizationName: session.organizationName, now, engineering });
  return { kind: "ready", session, facts, snapshot: buildFounderSnapshot(facts, now), notes, now };
});
