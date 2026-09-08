import { getCampaignPerformance, getGrowthOpportunities, getMessageFailuresSummary, getRetentionSummary } from "@rinads/salon-server";
import { Badge, Card, EmptyState } from "@rinads/ui";
import Link from "next/link";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";

export const metadata = { title: "Growth — R GLOW Console" };

const IMPACT_TONE = "bg-rose-100 text-rose-800";

const CAMPAIGN_STATUS_TONE: Record<string, string> = {
  draft: "bg-gray-200 text-gray-600",
  approved: "bg-blue-100 text-blue-800",
  sending: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  partially_failed: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-600",
};

export default async function GrowthPage() {
  const tenancy = await requireTenancy();
  const { repo, campaigns, client } = await getSalonDeps();

  const [retention, failures, campaignPerformance, opportunities] = await Promise.all([
    getRetentionSummary(repo, tenancy.organizationId),
    getMessageFailuresSummary(client, tenancy.organizationId),
    getCampaignPerformance(campaigns, tenancy.organizationId, 5),
    getGrowthOpportunities(repo, campaigns, client, tenancy.organizationId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Growth</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Retention, campaign performance, and message delivery health — draft new campaigns from{" "}
            <Link href="/campaigns" className="text-rinads-primary underline">
              Campaigns
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Repeat rate</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{retention.repeatRatePct}%</p>
          <p className="text-xs text-muted-foreground">
            {retention.repeatCustomers} of {retention.totalCustomersWithVisits} customers have visited 2+ times
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Message failures</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{failures.failedCount + failures.deadLetterCount}</p>
          <p className="text-xs text-muted-foreground">
            {failures.deadLetterCount} dead-lettered · {failures.notConfiguredCount} not_configured
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active campaigns</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {campaignPerformance.filter((c) => c.status === "sending" || c.status === "approved").length}
          </p>
          <p className="text-xs text-muted-foreground">
            <Link href="/campaigns" className="text-rinads-primary underline">
              Manage campaigns →
            </Link>
          </p>
        </Card>
      </div>

      <Card>
        <p className="section-title">Growth opportunities</p>
        {opportunities.length === 0 ? (
          <EmptyState title="Nothing urgent" description="No growth signals are ranked right now." />
        ) : (
          <ol className="mt-3 space-y-2">
            {opportunities.map((item, i) => (
              <li key={item.kind} className="flex items-start justify-between gap-3 rounded-xl border border-rinads-primary/10 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                    <Badge className={IMPACT_TONE}>score {Math.round(item.score)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <p className="rbac-note mt-3">
          Ask RINPO &ldquo;What growth opportunities need attention?&rdquo; then &ldquo;Create a reactivation campaign for
          high-value customers inactive for 90 days&rdquo; to act on this list directly.
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <p className="section-title">Recent campaign performance</p>
          <Link href="/campaigns" className="text-xs font-medium text-rinads-primary underline">
            View all campaigns →
          </Link>
        </div>
        {campaignPerformance.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            description="Draft your first campaign from the Campaigns page to see delivery and conversion metrics here."
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {campaignPerformance.map((c) => (
              <li key={c.campaignId} className="rounded-lg border border-rinads-primary/10 p-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/campaigns/${c.campaignId}`} className="font-medium text-foreground hover:underline">
                    {c.name}
                  </Link>
                  <Badge className={CAMPAIGN_STATUS_TONE[c.status] ?? "bg-surface-muted text-foreground"}>
                    {c.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.estimatedAudience} audience · {c.sentCount} sent · {c.deliveredCount} delivered · {c.failedCount} failed ·{" "}
                  {c.convertedCount} converted ({c.conversionRatePct}%)
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
