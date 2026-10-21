import { can, detectAdSignals, isAvailable } from "@rinads/company-os-engine";
import { loadAdsDetail, rowsToAdDays } from "@rinads/company-os-server";
import { ActionForm } from "@/components/os/company/ActionForm";
import { guard } from "@/components/os/company/guard";
import { Badge, Empty, Metric, MetricGrid, OsPage, Panel, SectionGate, Table, UnavailableMetric, severityTone } from "@/components/os/company/ui";
import { formatMoney, titleCase } from "@/lib/company-os/format";
import { n, s } from "@/lib/company-os/rows";

export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const g = await guard("/os/ads", "growth.read", "Ads");
  if (!g.ok) return g.block;
  const { session, now } = g.data;
  const manage = can(session.ctx, "growth.manage");
  const detail = await loadAdsDetail(session.db, session.ctx, now);
  const days = isAvailable(detail.metrics) ? rowsToAdDays(detail.metrics.data) : [];
  const signals = detectAdSignals(days);
  const spend = days.reduce((a, d) => a + d.spend, 0);
  const clicks = days.reduce((a, d) => a + d.clicks, 0);
  const impressions = days.reduce((a, d) => a + d.impressions, 0);
  const conversions = days.reduce((a, d) => a + d.conversions, 0);

  return (
    <OsPage title="Ads" eyebrow="Marketing" summary="Paid-media health from metrics that were actually imported. Signals show their numbers and thresholds; every budget change is a governed, approved action.">
      <Panel id="health" title="Last 30 days">
        {days.length === 0 ? (
          <UnavailableMetric label="Ad performance" state="not_connected" reason="No ad metrics have been imported. Import a provider export below or connect an official ad-platform adapter. Nothing is estimated." />
        ) : (
          <MetricGrid>
            <Metric label="Spend" value={formatMoney(spend)} />
            <Metric label="CTR" value={impressions ? `${((clicks / impressions) * 100).toFixed(2)}%` : "—"} hint={`${clicks} clicks / ${impressions} impressions`} />
            <Metric label="Conversions" value={conversions} />
            <Metric label="Cost per conversion" value={conversions ? formatMoney(spend / conversions) : "—"} />
          </MetricGrid>
        )}
      </Panel>

      <Panel id="signals" title="Signals" subtitle="Fatigue, low CTR, high cost per conversion, winning hooks and audiences, landing-page mismatch">
        {signals.length === 0 ? (
          <Empty title="No signals" hint={days.length === 0 ? "Signals need imported metrics." : "No thresholds were crossed in the imported data."} />
        ) : (
          <ul className="flex flex-col gap-3">
            {signals.map((sig) => (
              <li key={sig.id} className="rounded-2xl bg-white/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={severityTone(sig.severity)}>{sig.severity}</Badge>
                  <span className="text-sm font-semibold text-gray-900">{sig.title}</span>
                  <Badge>{sig.basis === "observed" ? "observed" : "default threshold"}</Badge>
                </div>
                <p className="mt-1 text-xs text-gray-700">{sig.evidence}</p>
                <p className="mt-1 text-xs text-gray-600"><span className="font-semibold">Suggestion:</span> {sig.recommendation}{sig.requiresApproval ? " — would need approval." : ""}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel id="campaigns" title="Ad campaigns" subtitle="Budget changes beyond policy, or any first budget, are HIGH risk and need an approver">
        <SectionGate section={detail.ads} label="Ad campaigns">
          {(rows) => (
            <Table
              caption="Ad campaigns"
              rows={rows}
              empty={<Empty title="No ad campaigns registered" />}
              columns={[
                { header: "Campaign", cell: (r) => s(r, "name") },
                { header: "Platform", cell: (r) => titleCase(s(r, "platform")) },
                { header: "Status", cell: (r) => <Badge>{titleCase(s(r, "status"))}</Badge> },
                { header: "Daily budget", cell: (r) => (n(r, "daily_budget") === null ? "Not set" : formatMoney(n(r, "daily_budget") ?? 0, s(r, "currency") || "INR")) },
                { header: "Landing page", cell: (r) => s(r, "landing_page") || "—" },
              ]}
            />
          )}
        </SectionGate>
        {manage && isAvailable(detail.ads) && (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <ActionForm actionKey="ad.create" title="Register an ad campaign" submitLabel="Register" fields={[{ name: "name", label: "Name", required: true }, { name: "platform", label: "Platform", kind: "select", required: true, options: ["meta", "google", "youtube", "linkedin", "x", "other"].map((p) => ({ value: p, label: titleCase(p) })) }, { name: "externalId", label: "Platform campaign id" }, { name: "landingPage", label: "Landing page URL" }]} />
            <ActionForm actionKey="ads.budget_change" title="Change a daily budget" submitLabel="Request approval for budget change" fields={[{ name: "adCampaignId", label: "Ad campaign", kind: "select", required: true, options: detail.ads.data.map((r) => ({ value: s(r, "id"), label: s(r, "name") })) }, { name: "proposedBudget", label: "Proposed daily budget (₹)", kind: "number", required: true }, { name: "reason", label: "Reason", required: true }]} />
            <ActionForm actionKey="ads.import_metrics" title="Import daily metrics (provider export)" submitLabel="Import" fields={[{ name: "adCampaignId", label: "Ad campaign", kind: "select", required: true, options: detail.ads.data.map((r) => ({ value: s(r, "id"), label: s(r, "name") })) }, { name: "rows", label: "CSV lines: adId,adName,date,spend,impressions,clicks,conversions[,frequency,hook,audience,landingPage]", kind: "adrows", required: true }]} />
          </div>
        )}
      </Panel>
    </OsPage>
  );
}
