import { isPrivilegedRoleKey } from "@rinads/permissions";
import { Badge, Card, EmptyState } from "@rinads/ui";
import Link from "next/link";
import { getSalonDeps } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { CampaignActions } from "./CampaignActions";
import { RecipientsList } from "./RecipientsList";

export const metadata = { title: "Campaign — R GLOW Console" };

const STATUS_TONE: Record<string, string> = {
  draft: "bg-gray-200 text-gray-600",
  approved: "bg-blue-100 text-blue-800",
  sending: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  partially_failed: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-600",
};

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenancy = await requireTenancy();
  const { campaigns, repo } = await getSalonDeps();
  const canManage = isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("salon.campaigns.manage");
  const canApproveOrSend = isPrivilegedRoleKey(tenancy.roleKey ?? "") || tenancy.permissions.includes("org.manage");

  const campaignResult = await campaigns.getCampaign(id);
  if (!campaignResult.ok) {
    return (
      <div className="space-y-4">
        <Link href="/campaigns" className="text-sm text-rinads-primary underline">
          ← Back to campaigns
        </Link>
        <Card>
          <p className="text-sm text-danger">Could not load this campaign: {campaignResult.error.message}</p>
        </Card>
      </div>
    );
  }
  const campaign = campaignResult.data;

  // Re-preview (and refresh estimated_audience) for campaigns that haven't been sent yet — this
  // never sends anything, `previewAudience` only reads the segment criteria against current customers.
  const previewResult =
    campaign.status === "draft" || campaign.status === "approved"
      ? await campaigns.previewAudience(tenancy.organizationId, id)
      : null;

  const recipientsResult = await campaigns.listRecipients(id);
  const recipients = recipientsResult.ok ? recipientsResult.data : [];

  const customerIds = new Set([
    ...recipients.map((r) => r.customerId),
    ...(previewResult?.ok ? previewResult.data.eligible.map((c) => c.id) : []),
    ...(previewResult?.ok ? previewResult.data.excluded.map((e) => e.customer.id) : []),
  ]);
  const customersResult = await repo.listCustomers(tenancy.organizationId);
  const customersById = new Map((customersResult.ok ? customersResult.data : []).filter((c) => customerIds.has(c.id)).map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <Link href="/campaigns" className="text-sm text-rinads-primary underline">
        ← Back to campaigns
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">{campaign.name}</h2>
            <Badge className={STATUS_TONE[campaign.status] ?? "bg-surface-muted text-foreground"}>
              {campaign.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {campaign.campaignType} · {campaign.channel} via template <code>{campaign.templateKey}</code>
          </p>
        </div>
        {canManage || canApproveOrSend ? (
          <CampaignActions campaignId={campaign.id} status={campaign.status} canApproveOrSend={canApproveOrSend} />
        ) : null}
      </div>

      <Card>
        <p className="section-title">Message</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{campaign.messageBody}</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estimated audience</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{campaign.estimatedAudience}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sent / delivered</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {campaign.sentCount} / {campaign.deliveredCount}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Failed</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{campaign.failedCount}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Converted</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{campaign.convertedCount}</p>
        </Card>
      </div>

      {previewResult ? (
        <Card>
          <p className="section-title">Audience preview</p>
          {!previewResult.ok ? (
            <p className="mt-2 text-sm text-danger">Could not evaluate segment: {previewResult.error.message}</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                {previewResult.data.eligible.length} eligible · {previewResult.data.excluded.length} excluded
              </p>
              {previewResult.data.eligible.length === 0 ? (
                <EmptyState title="No matching customers" description="Widen the segment criteria to find an audience." />
              ) : (
                <ul className="mt-3 space-y-1.5">
                  {previewResult.data.eligible.slice(0, 25).map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-lg border border-rinads-primary/10 p-2 text-sm">
                      <span>{c.name ?? c.phone}</span>
                      <Badge className="bg-emerald-100 text-emerald-800">eligible</Badge>
                    </li>
                  ))}
                  {previewResult.data.eligible.length > 25 ? (
                    <li className="text-xs text-muted-foreground">…and {previewResult.data.eligible.length - 25} more</li>
                  ) : null}
                </ul>
              )}
              {previewResult.data.excluded.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {previewResult.data.excluded.slice(0, 25).map(({ customer, reason }) => (
                    <li
                      key={customer.id}
                      className="flex items-center justify-between rounded-lg border border-rinads-primary/10 p-2 text-sm"
                    >
                      <span>{customer.name ?? customer.phone}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{reason}</span>
                        <Badge className="bg-gray-200 text-gray-600">excluded</Badge>
                      </span>
                    </li>
                  ))}
                  {previewResult.data.excluded.length > 25 ? (
                    <li className="text-xs text-muted-foreground">…and {previewResult.data.excluded.length - 25} more</li>
                  ) : null}
                </ul>
              ) : null}
            </>
          )}
        </Card>
      ) : null}

      <Card>
        <p className="section-title">Recipients</p>
        {recipients.length === 0 ? (
          <EmptyState title="No recipients yet" description="Recipients appear here once the campaign is sent." />
        ) : (
          <RecipientsList
            campaignId={campaign.id}
            recipients={recipients}
            customerLabels={Object.fromEntries([...customersById.entries()].map(([id, c]) => [id, c.name ?? c.phone]))}
            canManage={canManage}
          />
        )}
      </Card>
    </div>
  );
}
