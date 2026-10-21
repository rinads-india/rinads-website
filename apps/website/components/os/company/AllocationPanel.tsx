import { can, recommendForOpenTasks, type OrgContext, type CompanyFacts } from "@rinads/company-os-engine";
import { personOptions } from "@/lib/company-os/options";
import { formatDate, titleCase } from "@/lib/company-os/format";
import { ActionForm } from "./ActionForm";
import { QuickAction } from "./QuickAction";
import { Badge, Empty } from "./ui";

/** Explainable assignment recommendations. Advisory only — the manager decides and any override needs a rationale. */
export function AllocationPanel({ facts, ctx, now }: { facts: CompanyFacts; ctx: OrgContext; now: Date }) {
  const rec = recommendForOpenTasks(facts, now, 5);
  if (rec.state === "unavailable") {
    return <Empty title="Recommendations unavailable" hint={rec.reason} />;
  }
  if (rec.items.length === 0) return <Empty title="No unassigned or high-priority work needs allocation" />;
  const manage = can(ctx, "people.write");
  const people = personOptions(facts);

  return (
    <ul className="flex flex-col gap-4">
      {rec.items.map(({ task, result }) => {
        const top = result.recommendations.find((r) => r.eligible) ?? null;
        return (
          <li key={task.id} className="rounded-2xl bg-white/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">{task.title}</span>
              <Badge tone={task.priority === "urgent" ? "bad" : task.priority === "high" ? "warn" : "neutral"}>{task.priority}</Badge>
              <Badge>{task.assigneeId ? "assigned" : "unassigned"}</Badge>
              <Badge tone={result.confidence === "high" ? "good" : result.confidence === "medium" ? "warn" : "bad"}>confidence: {result.confidence}</Badge>
              {task.dueAt && <span className="text-xs text-gray-500">due {formatDate(task.dueAt)}</span>}
            </div>
            {result.deferred && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">{result.deferredReason}</p>}
            {result.confidenceNotes.length > 0 && <p className="mt-2 text-xs text-gray-500">Less certain because: {result.confidenceNotes.join(" ")}</p>}
            {result.recommendations.length === 0 ? (
              <p className="mt-2 text-xs text-gray-600">No team members with recorded profiles to recommend.</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-2">
                {result.recommendations.slice(0, 3).map((r) => (
                  <li key={r.userId} className="rounded-xl border border-gray-200 bg-white/70 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">#{r.rank} {r.name}</span>
                      <Badge tone={r.eligible ? "good" : "bad"}>{r.eligible ? `${Math.round(r.total)}/100` : "not eligible"}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-700">{r.explanation}</p>
                    {r.eligible && (
                      <details className="mt-1 text-xs text-gray-600">
                        <summary className="cursor-pointer font-medium">Factor breakdown</summary>
                        <ul className="mt-1 list-disc pl-5">
                          {r.factors.map((f) => (
                            <li key={f.key}>
                              {titleCase(f.key)}: {f.included ? `${Math.round(f.score * 100)}% × weight ${Math.round(f.weight)}` : "excluded"} — {f.detail}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {manage && r.eligible && r.rank === 1 && top && (
                      <div className="mt-2">
                        <QuickAction
                          actionKey="task.assign"
                          tone="primary"
                          label={`Assign to ${r.name}`}
                          input={{ taskId: task.id, assigneeId: r.userId, recommendedWorkerId: top.userId, followedRecommendation: true, confidence: result.confidence, factorSnapshot: r.factors }}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
            {manage && people.length > 0 && (
              <div className="mt-3">
                <ActionForm
                  compact
                  actionKey="task.assign"
                  title="Assign someone else (rationale required)"
                  submitLabel="Assign with rationale"
                  fixed={{ taskId: task.id, recommendedWorkerId: top?.userId, followedRecommendation: false, confidence: result.confidence }}
                  fields={[
                    { name: "assigneeId", label: "Assign to", kind: "select", required: true, options: people },
                    { name: "overrideReason", label: "Why this person?", required: true, help: "Recorded with the recommendation so overrides stay explainable." },
                  ]}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
