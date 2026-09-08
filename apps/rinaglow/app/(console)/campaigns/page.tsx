import { isPrivilegedRoleKey } from "@rinads/permissions";
import { Badge, Card, EmptyState } from "@rinads/ui";
import Link from "next/link";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { CampaignDraftForm } from "./CampaignDraftForm";

export const metadata = { title: "Campaigns — R GLOW Console" };

const STATUS_TONE: Record<string, string> = {
  draft: "bg-gray-200 text-gray-600",
  approved: "bg-blue-100 text-blue-800",
  sending: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  partially_failed: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-600",
};

export default async function CampaignsPage() {
  const tenancy = await requireTenancy();
  const { campaigns } = await getSalonDeps();
  const canDraft = isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("salon.campaigns.manage");

  const campaignsResult = await campaigns.listCampaigns(tenancy.organizationId);
  const allCampaigns = campaignsResult.ok ? campaignsResult.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Campaigns</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Segment -&gt; draft -&gt; preview audience -&gt; approve -&gt; send. Real Twilio WhatsApp delivery with webhook-driven status —
          see{" "}
          <Link href="/growth" className="text-rinads-primary underline">
            Growth
          </Link>{" "}
          for performance.
        </p>
      </div>

      {canDraft ? (
        <Card>
          <p className="section-title">New campaign draft</p>
          <div className="mt-3">
            <CampaignDraftForm />
          </div>
        </Card>
      ) : null}

      <Card>
        <p className="section-title">All campaigns</p>
        {allCampaigns.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            description={canDraft ? "Create your first draft above." : "An admin or manager can draft a campaign."}
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {allCampaigns.map((c) => (
              <li key={c.id} className="rounded-lg border border-rinads-primary/10 p-2.5 text-sm">
                <Link href={`/campaigns/${c.id}`} className="flex items-center justify-between gap-2 hover:underline">
                  <span className="font-medium text-foreground">{c.name}</span>
                  <Badge className={STATUS_TONE[c.status] ?? "bg-surface-muted text-foreground"}>{c.status.replace("_", " ")}</Badge>
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.campaignType} · {c.channel} · {c.estimatedAudience} estimated audience · {c.sentCount} sent · {c.failedCount} failed
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
