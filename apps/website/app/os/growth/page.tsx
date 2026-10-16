import { CHANNEL_LABEL, CONTENT_CHANNELS, can, groupByIdea, isAvailable, type ContentChannel, type ContentItem, type ContentStatus } from "@rinads/company-os";
import { loadGrowthDetail } from "@rinads/company-os-server";
import { OsModuleBridge } from "@/components/os/OsModuleBridge";
import { ActionForm } from "@/components/os/company/ActionForm";
import { guard } from "@/components/os/company/guard";
import { QuickAction } from "@/components/os/company/QuickAction";
import { Badge, Empty, LinkButton, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { formatDate, formatMoney, titleCase } from "@/lib/company-os/format";
import { n, s, sn } from "@/lib/company-os/rows";
import { getGrowthModuleDestinations } from "@/lib/os-module-destinations";

export const dynamic = "force-dynamic";
const NEXT: Partial<Record<ContentStatus, { to: ContentStatus; label: string }>> = {
  idea: { to: "drafting", label: "Start drafting" },
  drafting: { to: "in_review", label: "Send to review" },
  in_review: { to: "approved", label: "Approve" },
};

function toItem(r: Record<string, unknown>): ContentItem {
  const row = r as Record<string, unknown>;
  return {
    id: String(row.id),
    campaignId: row.campaign_id ? String(row.campaign_id) : null,
    sourceIdeaId: String(row.source_idea_id),
    channel: String(row.channel) as ContentChannel,
    status: String(row.status) as ContentStatus,
    title: String(row.title),
    assetId: row.asset_id ? String(row.asset_id) : null,
    scheduledAt: row.scheduled_at ? String(row.scheduled_at) : null,
    publishedAt: row.published_at ? String(row.published_at) : null,
    externalUrl: row.external_url ? String(row.external_url) : null,
  };
}

export default async function GrowthPage() {
  // Growth stays reachable for every member (legacy bridge below); the campaign workspace needs growth.read.
  const g = await guard("/os/growth", null, "Growth");
  if (!g.ok) return g.block;
  const { session, facts } = g.data;
  const canRead = can(session.ctx, "growth.read");
  const manage = can(session.ctx, "growth.manage");
  const detail = canRead ? await loadGrowthDetail(session.db, session.ctx) : null;

  return (
    <OsPage title="Growth" eyebrow="Marketing" summary="One campaign and content model across web, blog, YouTube, Shorts, Instagram, Facebook, LinkedIn, X, WhatsApp, email, Google Business and paid ads. Channel variants share one source idea." actions={<LinkButton href="/os/ads">Ads</LinkButton>}>
      {detail ? (
        <>
          <Panel id="campaigns" title="Campaigns">
            <SectionGate section={detail.campaigns} label="Campaigns">
              {(rows) => (
                <Table
                  caption="Campaigns"
                  rows={rows}
                  empty={<Empty title="No campaigns yet" />}
                  columns={[
                    { header: "Campaign", cell: (r) => s(r, "name") },
                    { header: "Status", cell: (r) => <Badge tone={s(r, "status") === "active" ? "good" : "neutral"}>{titleCase(s(r, "status"))}</Badge> },
                    { header: "Channels", cell: (r) => (Array.isArray(r.channels) && r.channels.length ? (r.channels as string[]).map((c) => CHANNEL_LABEL[c as ContentChannel] ?? c).join(", ") : "—") },
                    { header: "Budget", cell: (r) => (n(r, "budget") === null ? "—" : formatMoney(n(r, "budget") ?? 0)) },
                    { header: "Runs", cell: (r) => `${formatDate(sn(r, "start_date"))} → ${formatDate(sn(r, "end_date"))}` },
                  ]}
                />
              )}
            </SectionGate>
            {manage && (
              <div className="mt-4">
                <ActionForm actionKey="campaign.create" title="New campaign" submitLabel="Create campaign" fields={[{ name: "name", label: "Name", required: true }, { name: "objective", label: "Objective" }, { name: "budget", label: "Budget (₹)", kind: "number" }, { name: "startDate", label: "Start", kind: "date" }, { name: "endDate", label: "End", kind: "date" }, { name: "channels", label: "Channels (comma separated keys)", kind: "csv", help: CONTENT_CHANNELS.join(", ") }]} />
              </div>
            )}
          </Panel>

          <Panel id="content" title="Content ideas and channel variants" subtitle="Publishing is HIGH risk for client content: it needs an approved asset and an approver">
            <SectionGate section={detail.content} label="Content">
              {(rows) => {
                const groups = groupByIdea(rows.map(toItem));
                if (groups.length === 0) return <Empty title="No content yet" hint="Create an idea, then add a variant per channel." />;
                return (
                  <ul className="flex flex-col gap-3">
                    {groups.map((grp) => (
                      <li key={grp.sourceIdeaId} className="rounded-2xl bg-white/60 p-4">
                        <p className="text-sm font-semibold text-gray-900">{grp.title}</p>
                        <ul className="mt-2 flex flex-col gap-2">
                          {grp.variants.map((v) => {
                            const step = NEXT[v.status];
                            return (
                              <li key={v.id} className="flex flex-wrap items-center gap-2 text-xs">
                                <Badge>{CHANNEL_LABEL[v.channel] ?? v.channel}</Badge>
                                <Badge tone={v.status === "published" ? "good" : v.status === "approved" ? "info" : "neutral"}>{titleCase(v.status)}</Badge>
                                {v.externalUrl && <span className="text-gray-500">{v.externalUrl}</span>}
                                {manage && step && <QuickAction actionKey="content.update" input={{ contentId: v.id, status: step.to }} label={step.label} />}
                                {manage && (v.status === "approved" || v.status === "scheduled") && <QuickAction actionKey="content.publish" input={{ contentId: v.id }} label="Publish (needs approval)" />}
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                    ))}
                  </ul>
                );
              }}
            </SectionGate>
            {manage && (
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <ActionForm actionKey="content.create" title="New idea (root item)" submitLabel="Create idea" fixed={{}} fields={[{ name: "title", label: "Title", required: true }, { name: "channel", label: "First channel", kind: "select", required: true, options: CONTENT_CHANNELS.map((c) => ({ value: c, label: CHANNEL_LABEL[c] })) }, { name: "campaignId", label: "Campaign", kind: "select", options: isAvailable(detail.campaigns) ? detail.campaigns.data.map((r) => ({ value: s(r, "id"), label: s(r, "name") })) : [] }]} />
                <ActionForm
                  actionKey="content.create"
                  title="Add a channel variant to an idea"
                  submitLabel="Add variant"
                  fields={[
                    { name: "sourceIdeaId", label: "Idea", kind: "select", required: true, options: isAvailable(detail.content) ? groupByIdea(detail.content.data.map(toItem)).map((x) => ({ value: x.sourceIdeaId, label: x.title })) : [] },
                    { name: "title", label: "Variant title", required: true },
                    { name: "channel", label: "Channel", kind: "select", required: true, options: CONTENT_CHANNELS.map((c) => ({ value: c, label: CHANNEL_LABEL[c] })) },
                  ]}
                />
              </div>
            )}
          </Panel>
        </>
      ) : (
        <Panel title="Campaign workspace"><p className="text-sm text-gray-700">Your role does not include <code className="rounded bg-gray-100 px-1">growth.read</code>. The existing growth tools below remain available.</p></Panel>
      )}
      <span className="sr-only">{facts.organizationName}</span>
      <OsModuleBridge config={getGrowthModuleDestinations()} />
    </OsPage>
  );
}
