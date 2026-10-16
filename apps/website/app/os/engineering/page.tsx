import { isAvailable } from "@rinads/company-os";
import { guard } from "@/components/os/company/guard";
import { Badge, Empty, Metric, MetricGrid, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { formatDate } from "@/lib/company-os/format";

export const dynamic = "force-dynamic";

export default async function EngineeringPage() {
  const g = await guard("/os/engineering", "engineering.read", "Engineering");
  if (!g.ok) return g.block;
  const { snapshot } = g.data;
  const eng = snapshot.engineering;
  const blockers =
    (isAvailable(eng.github) ? eng.github.data.failingChecks.length : 0) + (isAvailable(eng.vercel) ? eng.vercel.data.projects.filter((p) => !p.ready).length : 0) + (isAvailable(eng.supabase) && !eng.supabase.data.healthy ? 1 : 0);

  return (
    <OsPage title="Engineering" eyebrow="Platform health" summary="Read-only signals from GitHub, Vercel and Supabase using server-side credentials that are never shown. A source that is not connected says so; nothing is inferred.">
      <Panel id="readiness" title="Release readiness">
        {blockers === 0 && [eng.github, eng.vercel, eng.supabase].every((x) => x.state === "available") ? (
          <p className="text-sm text-gray-800"><Badge tone="good">no blockers seen</Badge> All three sources are connected and report no failing checks, unready production deployments or auth-health problems. This is a signal, not release approval — production deploys and migrations remain founder-approved, staged operations.</p>
        ) : (
          <p className="text-sm text-gray-800">
            {blockers > 0 ? <><Badge tone="bad">{blockers} signal{blockers === 1 ? "" : "s"} need attention</Badge> See below. </> : <Badge tone="warn">incomplete picture</Badge>}
            {[eng.github, eng.vercel, eng.supabase].some((x) => x.state !== "available") && " One or more sources are not connected or unavailable, so readiness cannot be fully assessed here."}
          </p>
        )}
      </Panel>

      <Panel id="github" title="GitHub" subtitle="Open pull requests and failing checks">
        <SectionGate section={eng.github} label="GitHub">
          {(gh) => (
            <>
              <MetricGrid>
                <Metric label="Repository" value={gh.repository} />
                <Metric label="Open PRs" value={gh.openPullRequests} />
                <Metric label="Failing checks" value={gh.failingChecks.length} tone={gh.failingChecks.length > 0 ? "bad" : undefined} />
                <Metric label="Default branch" value={gh.defaultBranchCommit ? gh.defaultBranchCommit.slice(0, 7) : "—"} />
              </MetricGrid>
              <div className="mt-3">
                <Table caption="Failing checks" rows={gh.failingChecks} empty={<Empty title="No failing checks on open PRs" />} columns={[{ header: "PR", cell: (c) => `#${c.pr}` }, { header: "Title", cell: (c) => c.title }, { header: "Check", cell: (c) => <Badge tone="bad">{c.check}</Badge> }]} />
              </div>
            </>
          )}
        </SectionGate>
      </Panel>

      <Panel id="vercel" title="Vercel" subtitle="Latest production deployment per project">
        <SectionGate section={eng.vercel} label="Vercel">
          {(v) => (
            <Table
              caption="Production deployments"
              rows={v.projects}
              empty={<Empty title="No projects configured" />}
              columns={[
                { header: "Project", cell: (p) => p.name },
                { header: "State", cell: (p) => <Badge tone={p.ready ? "good" : "bad"}>{p.state}</Badge> },
                { header: "Commit", cell: (p) => (p.commitSha ? p.commitSha.slice(0, 7) : "—") },
                { header: "Deployed", cell: (p) => formatDate(p.createdAt) },
              ]}
            />
          )}
        </SectionGate>
      </Panel>

      <Panel id="supabase" title="Supabase" subtitle="Auth health endpoint (anon key only)">
        <SectionGate section={eng.supabase} label="Supabase">
          {(sb) => (
            <MetricGrid>
              <Metric label="Auth health" value={sb.healthy ? "Healthy" : "Unhealthy"} tone={sb.healthy ? undefined : "bad"} hint={sb.detail} />
              <Metric label="Applied migrations" value={sb.appliedMigrations ?? "Not read"} hint="Reading migration state needs a privileged token; it is not guessed." />
            </MetricGrid>
          )}
        </SectionGate>
      </Panel>

      <Panel id="boundary" title="What this page cannot do">
        <p className="text-sm text-gray-700">Production deployment, database migration, secret rotation and permission changes exist in the action catalogue as non-executable, always-approval items: Company OS and AI roles can describe them but never run them. They stay founder-approved staged operations (branch → PR → CI → staging → UAT → approval → production).</p>
      </Panel>
    </OsPage>
  );
}
