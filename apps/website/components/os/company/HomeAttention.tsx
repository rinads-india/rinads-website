import Link from "next/link";
import { can } from "@rinads/company-os-engine";
import { loadCompanyData } from "@/lib/company-os/load";
import { memberNames } from "@/lib/company-os/names";
import { AttentionList } from "./sections";
import { Panel } from "./ui";

/**
 * Compact "what needs you" strip on Home. Renders nothing in demo mode / without an organisation,
 * so the existing Home command centre (and its tests) are untouched there.
 */
export async function HomeAttention() {
  const data = await loadCompanyData("/os");
  if (data.kind !== "ready") return null;
  const { snapshot, facts, session } = data;
  const founderView = can(session.ctx, "company.founder.view");
  return (
    <Panel
      id="company-attention"
      title="Needs attention"
      subtitle={`${snapshot.pulse.attentionCount} open · ${snapshot.pulse.criticalCount} critical — exceptions only, from data you are permitted to see`}
      right={founderView ? <Link href="/os/founder" className="text-xs font-semibold underline">Open Founder</Link> : <Link href="/os/work" className="text-xs font-semibold underline">Open Work</Link>}
    >
      <AttentionList items={snapshot.attention} names={memberNames(facts)} limit={3} />
      {snapshot.pulse.sectionsUnavailable.length > 0 && (
        <p className="mt-3 text-xs text-gray-500">Not shown (unavailable or not connected): {snapshot.pulse.sectionsUnavailable.join(", ")}.</p>
      )}
    </Panel>
  );
}
