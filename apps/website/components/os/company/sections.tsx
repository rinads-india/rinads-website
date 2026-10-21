import Link from "next/link";
import { can, type ApprovalFact, type AttentionItem, type OrgContext } from "@rinads/company-os-engine";
import { formatDateTime, titleCase } from "@/lib/company-os/format";
import { nameOf } from "@/lib/company-os/names";
import { ApprovalControls } from "./ApprovalControls";
import { Badge, Empty, severityTone } from "./ui";

export function AttentionList({ items, names, limit }: { items: readonly AttentionItem[]; names: ReadonlyMap<string, string>; limit?: number }) {
  const shown = limit ? items.slice(0, limit) : items;
  if (shown.length === 0) {
    return <Empty title="No exceptions right now" hint="Nothing in the data you can see needs attention. This list shows exceptions only — routine activity is summarised elsewhere." />;
  }
  return (
    <ul className="flex flex-col gap-3">
      {shown.map((item) => (
        <li key={item.id} className="rounded-2xl bg-white/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={severityTone(item.severity)}>{item.severity}</Badge>
            <Badge>{titleCase(item.category)}</Badge>
            <Link href={item.href} className="text-sm font-semibold text-gray-900 hover:underline">{item.title}</Link>
          </div>
          <p className="mt-2 text-xs text-gray-600"><span className="font-semibold">Why it matters:</span> {item.why}</p>
          <ul className="mt-2 list-disc pl-5 text-xs text-gray-700">
            {item.evidence.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-600">
            <span className="font-semibold">Owner:</span> {item.ownerIds.length ? item.ownerIds.map((id) => nameOf(names, id)).join(", ") : "Unassigned"}
            {" · "}
            <span className="font-semibold">Next:</span> {item.nextAction.label}
            {item.nextAction.requiresApproval && <Badge tone="info">needs approval</Badge>}
          </p>
        </li>
      ))}
    </ul>
  );
}

const RISK_TONE = { LOW: "neutral", MEDIUM: "info", HIGH: "warn", CRITICAL: "bad" } as const;

export function PendingApprovals({ approvals, ctx, now, limit }: { approvals: readonly ApprovalFact[]; ctx: OrgContext; now: Date; limit?: number }) {
  const shown = limit ? approvals.slice(0, limit) : approvals;
  if (shown.length === 0) return <Empty title="No decisions waiting" hint="Governed actions that need a human approver appear here." />;
  const mayDecide = can(ctx, "approvals.decide");
  return (
    <ul className="flex flex-col gap-3">
      {shown.map((a) => {
        const own = a.requestedBy === ctx.userId && a.actorKind !== "agent";
        const critical = a.risk === "CRITICAL" && !(ctx.roleKey === "founder" || ctx.roleKey === "super_admin" || ctx.roleKey === "admin");
        const reason = !mayDecide ? "You do not have approvals.decide." : own ? "You requested this, so someone else must approve it." : critical ? "CRITICAL actions need an admin or founder." : undefined;
        return (
          <li key={a.id} className="rounded-2xl bg-white/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={RISK_TONE[a.risk]}>{a.risk}</Badge>
              <span className="text-sm font-semibold text-gray-900">{a.summary}</span>
              {a.actorKind === "agent" && <Badge tone="info">prepared by {titleCase(a.agentRole ?? "AI role")}</Badge>}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Requested {formatDateTime(a.requestedAt)}
              {a.expiresAt ? ` · expires ${formatDateTime(a.expiresAt)}` : ""} · action {a.actionType}
              {now.getTime() - new Date(a.requestedAt).getTime() > 86_400_000 ? " · waiting over 24h" : ""}
            </p>
            <div className="mt-3">
              <ApprovalControls actionId={a.id} canDecide={!reason} reason={reason} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
