import { assetProblems, can, canPublishAsset, isAvailable } from "@rinads/company-os";
import { loadStudioDetail, rowToAsset } from "@rinads/company-os-server";
import { ActionForm } from "@/components/os/company/ActionForm";
import { guard } from "@/components/os/company/guard";
import { QuickAction } from "@/components/os/company/QuickAction";
import { Badge, Empty, Metric, MetricGrid, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { formatDate, titleCase } from "@/lib/company-os/format";
import { memberNames, nameOf } from "@/lib/company-os/names";
import { companyOptions } from "@/lib/company-os/options";
import { s } from "@/lib/company-os/rows";

export const dynamic = "force-dynamic";
const KINDS = ["image", "video", "audio", "voice", "animation", "vfx", "design", "copy", "script", "storyboard", "document"];

export default async function AssetsPage() {
  const g = await guard("/os/assets", "studio.read", "Assets");
  if (!g.ok) return g.block;
  const { facts, session } = g.data;
  const manage = can(session.ctx, "studio.manage");
  const detail = await loadStudioDetail(session.db, session.ctx);
  const names = memberNames(facts);

  return (
    <OsPage title="Assets" eyebrow="Production" summary="Every creative asset with its provenance: who or what made it, the model and prompt reference when AI was used, licensing, master/variant lineage, approval status and publishing history.">
      <Panel id="library" title="Asset library">
        <SectionGate section={detail.assets} label="Assets">
          {(rows) => {
            const records = rows.map((r) => ({ row: r, asset: rowToAsset(r) }));
            const blocked = records.filter((x) => assetProblems(x.asset).some((p) => p.blocking));
            return (
              <>
                <MetricGrid>
                  <Metric label="Assets" value={records.length} />
                  <Metric label="Approved" value={records.filter((x) => x.asset.approvalStatus === "approved").length} />
                  <Metric label="Waiting review" value={records.filter((x) => x.asset.approvalStatus === "submitted").length} />
                  <Metric label="Provenance gaps" value={blocked.length} tone={blocked.length > 0 ? "warn" : undefined} hint="Blocking gaps prevent approval" />
                </MetricGrid>
                <div className="mt-4">
                  <Table
                    caption="Creative assets"
                    rows={records}
                    empty={<Empty title="No assets registered" hint="Register an asset below. Provenance is required for approval." />}
                    columns={[
                      { header: "Asset", cell: ({ asset }) => <>{asset.title}<span className="text-gray-500"> · {titleCase(asset.kind)} v{asset.version} · {titleCase(asset.role)}</span></> },
                      { header: "Made by", cell: ({ asset }) => (asset.creatorKind === "human" ? nameOf(names, asset.creatorUserId) : `${titleCase(asset.creatorKind)}${asset.aiProvider ? `: ${asset.aiProvider}/${asset.aiModel ?? "?"}` : ""}`) },
                      { header: "Source", cell: ({ asset }) => titleCase(asset.sourceKind) },
                      { header: "Status", cell: ({ asset }) => <Badge tone={asset.approvalStatus === "approved" ? "good" : asset.approvalStatus === "rejected" ? "bad" : "neutral"}>{titleCase(asset.approvalStatus)}</Badge> },
                      {
                        header: "Provenance",
                        cell: ({ asset }) => {
                          const problems = assetProblems(asset);
                          return problems.length === 0 ? <Badge tone="good">complete</Badge> : <ul className="text-xs text-amber-900">{problems.map((p) => <li key={p.code}>{p.blocking ? "Blocks approval: " : ""}{p.message}</li>)}</ul>;
                        },
                      },
                      { header: "Publish", cell: ({ asset }) => { const r = canPublishAsset(asset); return r.ok ? <Badge tone="good">eligible</Badge> : <span className="text-xs text-gray-500">{r.reason}</span>; } },
                      {
                        header: "Review",
                        cell: ({ asset }) =>
                          manage ? (
                            <div className="flex flex-wrap gap-2">
                              {(asset.approvalStatus === "draft" || asset.approvalStatus === "rejected") && <QuickAction actionKey="asset.review" input={{ assetId: asset.id, decision: "submit" }} label="Submit" />}
                              {asset.approvalStatus === "submitted" && <QuickAction actionKey="asset.review" input={{ assetId: asset.id, decision: "approve" }} label="Approve" tone="primary" />}
                              {asset.approvalStatus === "submitted" && <QuickAction actionKey="asset.review" input={{ assetId: asset.id, decision: "reject", reason: "Rejected in review" }} label="Reject" />}
                            </div>
                          ) : null,
                      },
                    ]}
                  />
                </div>
              </>
            );
          }}
        </SectionGate>
        {manage && (
          <div className="mt-4">
            <ActionForm
              actionKey="asset.register"
              title="Register an asset"
              submitLabel="Register asset"
              fields={[
                { name: "title", label: "Title", required: true },
                { name: "kind", label: "Kind", kind: "select", required: true, options: KINDS.map((k) => ({ value: k, label: titleCase(k) })) },
                { name: "creatorKind", label: "Made by", kind: "select", required: true, options: [{ value: "human", label: "A person" }, { value: "ai", label: "AI" }, { value: "hybrid", label: "Person + AI" }] },
                { name: "aiProvider", label: "AI provider (if AI)" },
                { name: "aiModel", label: "AI model (if AI)" },
                { name: "promptRef", label: "Prompt / version reference" },
                { name: "sourceKind", label: "Source", kind: "select", options: [{ value: "original", label: "Original" }, { value: "client_supplied", label: "Client supplied" }, { value: "stock", label: "Stock" }, { value: "ai_generated", label: "AI generated" }, { value: "third_party", label: "Third party" }] },
                { name: "licenseTerms", label: "Licence terms (required unless original)" },
                { name: "companyId", label: "Client", kind: "select", options: companyOptions(facts) },
                { name: "role", label: "Role", kind: "select", options: [{ value: "working", label: "Working" }, { value: "master", label: "Master" }, { value: "variant", label: "Channel variant" }] },
                { name: "parentAssetId", label: "Master asset (for variants)", kind: "select", options: isAvailable(detail.assets) ? detail.assets.data.map((r) => ({ value: s(r, "id"), label: s(r, "title") })) : [] },
                { name: "channel", label: "Channel (for variants)" },
              ]}
            />
          </div>
        )}
      </Panel>
      <Panel id="publishing" title="Publishing history" subtitle="Recorded by approved publish actions only">
        <SectionGate section={detail.publications} label="Publishing history">
          {(rows) => (
            <Table
              caption="Asset publications"
              rows={rows}
              empty={<Empty title="Nothing published yet" />}
              columns={[
                { header: "Channel", cell: (r) => titleCase(s(r, "channel")) },
                { header: "Published", cell: (r) => formatDate(s(r, "published_at")) },
                { header: "Link", cell: (r) => s(r, "external_url") || "—" },
              ]}
            />
          )}
        </SectionGate>
      </Panel>
    </OsPage>
  );
}
