import Link from "next/link";
import { isAvailable } from "@rinads/company-os";
import { AskRinpo } from "@/components/os/company/AskRinpo";
import { guard } from "@/components/os/company/guard";
import { AttentionList, PendingApprovals } from "@/components/os/company/sections";
import { Badge, LinkButton, Metric, MetricGrid, Notes, OsPage, Panel, SectionGate, Table, UnavailableMetric, severityTone } from "@/components/os/company/ui";
import { formatDate, formatDateTime, formatMoney, titleCase } from "@/lib/company-os/format";
import { memberNames, nameOf } from "@/lib/company-os/names";

export const dynamic = "force-dynamic";

export default async function FounderPage() {
  const g = await guard("/os/founder", "company.founder.view", "Founder Control Tower");
  if (!g.ok) return g.block;
  const { snapshot: s, facts, session, notes, now } = g.data;
  const names = memberNames(facts);

  const pending = isAvailable(facts.approvals) ? facts.approvals.data : [];
  const currency = s.receivables.state === "available" && s.receivables.data.currencies[0] ? s.receivables.data.currencies[0] : "INR";

  return (
    <OsPage
      title="Founder Control Tower"
      eyebrow={`${s.organizationName} · as of ${formatDateTime(s.asOf)}`}
      summary="Real, permission-filtered company state. Exceptions first. Where a source is unavailable it says so — nothing is estimated and there is no composite health score."
      actions={<AskRinpo />}
    >
      <Notes notes={notes} />

      <Panel id="pulse" title="Company pulse" subtitle="Direct facts from your operating data">
        <MetricGrid>
          {s.work.state === "available" ? (
            <Metric label="Open work" value={s.work.data.open} hint={`${s.work.data.dueToday} due today · ${s.work.data.overdue} overdue · ${s.work.data.blocked} blocked`} tone={s.work.data.overdue > 0 ? "warn" : undefined} />
          ) : (
            <UnavailableMetric label="Open work" reason={s.work.reason} state={s.work.state} />
          )}
          {s.pipeline.state === "available" ? (
            <Metric label="Weighted pipeline" value={formatMoney(s.pipeline.data.weightedValue)} hint={`${s.pipeline.data.openCount} open deals · ${formatMoney(s.pipeline.data.totalOpenValue)} priced · ${s.pipeline.data.unpricedCount} unpriced`} />
          ) : (
            <UnavailableMetric label="Weighted pipeline" reason={s.pipeline.reason} state={s.pipeline.state} />
          )}
          {s.receivables.state === "available" ? (
            <Metric label="Receivables" value={formatMoney(s.receivables.data.totalOutstanding, currency)} hint={`${formatMoney(s.receivables.data.totalOverdue, currency)} overdue across ${s.receivables.data.overdueCount} invoice(s)`} tone={s.receivables.data.totalOverdue > 0 ? "bad" : undefined} />
          ) : (
            <UnavailableMetric label="Receivables" reason={s.receivables.reason} state={s.receivables.state} />
          )}
          {s.cash.state === "available" ? (
            <Metric label="Received this month" value={formatMoney(s.cash.data.receivedThisPeriod, currency)} hint={`Last month ${formatMoney(s.cash.data.receivedPreviousPeriod, currency)} · cash basis`} />
          ) : (
            <UnavailableMetric label="Received this month" reason={s.cash.reason} state={s.cash.state} />
          )}
          {s.approvals.state === "available" ? (
            <Metric label="Decisions waiting" value={s.approvals.data.pending} hint={`${s.approvals.data.highRisk} high-risk · ${s.approvals.data.aged} over 24h · ${s.approvals.data.preparedByAgents} AI-prepared`} tone={s.approvals.data.pending > 0 ? "warn" : undefined} />
          ) : (
            <UnavailableMetric label="Decisions waiting" reason={s.approvals.reason} state={s.approvals.state} />
          )}
          {s.capacity.state === "available" ? (
            <Metric label="Team over capacity" value={s.capacity.data.overCapacity} hint={`${s.capacity.data.capacityNotRecorded} active member(s) with no capacity recorded`} tone={s.capacity.data.overCapacity > 0 ? "warn" : undefined} />
          ) : (
            <UnavailableMetric label="Team capacity" reason={s.capacity.reason} state={s.capacity.state} />
          )}
          {s.projectRisk.state === "available" ? (
            <Metric label="Active projects" value={s.projectRisk.data.activeProjects} hint={`${s.projectRisk.data.delayedMilestones} milestone(s) late · ${s.projectRisk.data.revisionLoops} revision loop(s)`} tone={s.projectRisk.data.delayedMilestones > 0 ? "warn" : undefined} />
          ) : (
            <UnavailableMetric label="Projects" reason={s.projectRisk.reason} state={s.projectRisk.state} />
          )}
          {s.studio.state === "available" ? (
            <Metric label="Studio jobs open" value={s.studio.data.openJobs} hint={`${s.studio.data.pastDue} past due · ${s.studio.data.inQa} in QA`} />
          ) : (
            <UnavailableMetric label="Studio" reason={s.studio.reason} state={s.studio.state} />
          )}
        </MetricGrid>
      </Panel>

      <Panel id="attention" title="Attention & decision queue" subtitle={`${s.pulse.attentionCount} exception(s), ${s.pulse.criticalCount} critical — decisions first, then by severity and age`} right={<LinkButton href="/os/approvals">Open approvals</LinkButton>}>
        <AttentionList items={s.attention} names={names} />
      </Panel>

      <Panel id="decisions" title="Decisions waiting on a human" subtitle="Governed actions never run until a permitted approver approves them">
        <SectionGate section={facts.approvals} label="Approvals">{() => <PendingApprovals approvals={pending} ctx={session.ctx} now={now} limit={5} />}</SectionGate>
      </Panel>

      <Panel id="clients" title="Clients at risk" subtitle="Stated rules only: invoice 30+ days overdue, project past due, 2+ change requests">
        <SectionGate section={s.clientRisk} label="Client risk">
          {(risks) =>
            risks.length === 0 ? (
              <p className="text-sm text-gray-600">No clients are flagged by those rules.</p>
            ) : (
              <Table
                caption="Clients at risk"
                rows={risks}
                columns={[
                  { header: "Client", cell: (r) => <Link className="font-semibold hover:underline" href={`/os/customers/${r.companyId}`}>{r.companyName}</Link> },
                  { header: "Severity", cell: (r) => <Badge tone={severityTone(r.severity)}>{r.severity}</Badge> },
                  { header: "Why", cell: (r) => r.reasons.join("; ") },
                ]}
              />
            )
          }
        </SectionGate>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel id="capacity" title="Team capacity" subtitle="Recorded weekly capacity vs open estimated work">
          <SectionGate section={s.capacity} label="Team capacity">
            {(c) => (
              <Table
                caption="Team capacity"
                rows={c.people}
                empty={<p className="text-sm text-gray-600">No people profiles recorded yet. Add skills and weekly capacity in People.</p>}
                columns={[
                  { header: "Person", cell: (p) => p.name },
                  { header: "Utilisation", cell: (p) => (p.utilisationPct === null ? <Badge>capacity not recorded</Badge> : <Badge tone={p.utilisationPct > 100 ? "bad" : p.utilisationPct > 80 ? "warn" : "good"}>{p.utilisationPct}%</Badge>) },
                  { header: "Open", cell: (p) => p.openTasks },
                ]}
              />
            )}
          </SectionGate>
        </Panel>

        <Panel id="growth" title="Studio, Growth & Ads" subtitle="Production and performance health">
          <ul className="space-y-2 text-sm text-gray-800">
            <li>
              Studio:{" "}
              {s.studio.state === "available" ? `${s.studio.data.openJobs} open · ${s.studio.data.assetsAwaitingApproval} asset(s) awaiting approval · ${s.studio.data.assetsMissingProvenance} missing provenance` : <span className="text-gray-500">{s.studio.reason}</span>}
            </li>
            <li>Active campaigns: {s.growth.activeCampaigns.state === "available" ? s.growth.activeCampaigns.data : <span className="text-gray-500">{s.growth.activeCampaigns.reason}</span>}</li>
            <li>Ads: {s.growth.adSignals.state === "available" ? `${s.growth.adSignals.data.total} signal(s), ${s.growth.adSignals.data.critical} critical` : <span className="text-gray-500">{s.growth.adSignals.state === "not_connected" ? "Not connected — " : ""}{s.growth.adSignals.reason}</span>}</li>
          </ul>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel id="engineering" title="Engineering" subtitle="GitHub · Vercel · Supabase (read-only)" right={<LinkButton href="/os/engineering">Details</LinkButton>}>
          <ul className="space-y-2 text-sm text-gray-800">
            <li>GitHub: {s.engineering.github.state === "available" ? `${s.engineering.github.data.openPullRequests} open PR(s), ${s.engineering.github.data.failingChecks.length} failing check(s)` : <span className="text-gray-500">{s.engineering.github.reason}</span>}</li>
            <li>Vercel: {s.engineering.vercel.state === "available" ? `${s.engineering.vercel.data.projects.filter((p) => p.ready).length}/${s.engineering.vercel.data.projects.length} production deployments ready` : <span className="text-gray-500">{s.engineering.vercel.reason}</span>}</li>
            <li>Supabase: {s.engineering.supabase.state === "available" ? `${s.engineering.supabase.data.healthy ? "healthy" : "UNHEALTHY"} — ${s.engineering.supabase.data.detail}` : <span className="text-gray-500">{s.engineering.supabase.reason}</span>}</li>
          </ul>
        </Panel>

        <Panel id="ai" title="AI providers, runs & cost" subtitle="Providers are replaceable workers behind RINADS Intelligence" right={<LinkButton href="/os/ai">Details</LinkButton>}>
          <SectionGate section={s.ai} label="AI runs">
            {(a) => (
              <div className="text-sm text-gray-800">
                <p>
                  {a.runs} run(s) in 7 days · {a.failed} failed · {a.blocked} blocked ·{" "}
                  {a.costUsd === null ? "cost not fully recorded" : `estimated cost $${a.costUsd}`}
                </p>
                {a.byProvider.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-xs text-gray-600">
                    {a.byProvider.map((p) => (
                      <li key={`${p.provider}/${p.model}`}>{p.provider}/{p.model}: {p.runs} run(s), {p.failed} failed</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </SectionGate>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel id="logistics" title="Logistics & communications exceptions" subtitle="Delayed shipments and failed or missed contacts">
          <ul className="space-y-2 text-sm text-gray-800">
            <li>Shipments: {s.logistics.state === "available" ? `${s.logistics.data.exceptions} exception(s) among ${s.logistics.data.active} active` : <span className="text-gray-500">{s.logistics.reason}</span>}</li>
            <li>Communication: {s.communication.state === "available" ? `${s.communication.data.failures} failed or missed in 14 days` : <span className="text-gray-500">{s.communication.reason}</span>}</li>
          </ul>
        </Panel>

        <Panel id="close" title="Daily close" subtitle={`IST ${s.dailyClose.day}`}>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-800">
            {([
              ["Tasks completed", s.dailyClose.tasksCompleted],
              ["Tasks created", s.dailyClose.tasksCreated],
              ["Carried over", s.dailyClose.tasksCarriedOver],
              ["Leads received", s.dailyClose.leadsReceived],
              ["Invoices issued", s.dailyClose.invoicesIssued],
              ["Deals moved", s.dailyClose.opportunitiesAdvanced],
              ["Decisions pending", s.dailyClose.approvalsStillPending],
            ] as const).map(([label, v]) => (
              <div key={label} className="contents">
                <dt className="text-gray-600">{label}</dt>
                <dd className="font-semibold">{v === null ? "—" : v}</dd>
              </div>
            ))}
            <dt className="text-gray-600">Payments received</dt>
            <dd className="font-semibold">{s.dailyClose.paymentsReceivedAmount === null ? "—" : formatMoney(s.dailyClose.paymentsReceivedAmount, currency)}</dd>
          </dl>
          {s.dailyClose.unavailable.length > 0 && <p className="mt-2 text-xs text-gray-500">Not counted (unavailable): {s.dailyClose.unavailable.join(", ")}</p>}
        </Panel>
      </div>

      <Panel id="tomorrow" title="Tomorrow's priorities" subtitle="Critical exceptions plus everything due tomorrow">
        {s.tomorrowPriorities.length === 0 ? (
          <p className="text-sm text-gray-600">Nothing specific is due tomorrow in the data you can see.</p>
        ) : (
          <ol className="list-decimal space-y-1 pl-5 text-sm text-gray-800">
            {s.tomorrowPriorities.map((p) => (
              <li key={p.id}>
                <Link href={p.href} className="font-semibold hover:underline">{p.title}</Link> <span className="text-gray-500">— {p.detail}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      <Panel id="availability" title="Data availability" subtitle="Anything listed here is excluded from the numbers above — never estimated">
        {s.pulse.sectionsUnavailable.length === 0 ? (
          <p className="text-sm text-gray-600">Every source is available to your role.</p>
        ) : (
          <p className="text-sm text-gray-700">{s.pulse.sectionsUnavailable.map(titleCase).join(" · ")}</p>
        )}
        <p className="mt-2 text-xs text-gray-500">Latest overdue invoice date shown above is computed from recorded due dates; dates are Asia/Kolkata. Next review: {formatDate(now.toISOString())}.</p>
      </Panel>

      <p className="sr-only">{nameOf(names, session.ctx.userId)}</p>
    </OsPage>
  );
}
