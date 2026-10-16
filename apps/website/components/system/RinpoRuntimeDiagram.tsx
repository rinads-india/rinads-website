const RUNTIME_LAYERS = [
  { id: "agents", label: "Agents", description: "Role-bound assistants that operate inside tenant context." },
  { id: "tools", label: "Tools", description: "Registered product actions with explicit permission boundaries." },
  { id: "workflows", label: "Workflows", description: "Multi-step business processes with durable state." },
  { id: "triggers", label: "Triggers", description: "Events, schedules, and conditions that start work." },
  { id: "permissions", label: "Permissions", description: "Authorization checks before sensitive steps run." },
  { id: "approvals", label: "Approvals", description: "Human gates for higher-risk mutations." },
  { id: "execution", label: "Execution", description: "Queued workers, retries, and controlled side effects." },
  { id: "audit", label: "Audit", description: "Traceable records for important platform actions." },
] as const;

type RinpoRuntimeDiagramProps = {
  className?: string;
  compact?: boolean;
};

export function RinpoRuntimeDiagram({ className = "", compact = false }: RinpoRuntimeDiagramProps) {
  return (
    <div className={className} aria-label="RINPO Runtime governance flow">
      <ol
        className={`grid gap-3 ${compact ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-4"}`}
      >
        {RUNTIME_LAYERS.map((layer, index) => (
          <li
            key={layer.id}
            className="relative rounded-2xl border border-rinads-primary/25 bg-black/40 px-4 py-4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rinads-primary">
              {String(index + 1).padStart(2, "0")}
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">{layer.label}</p>
            {!compact ? (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{layer.description}</p>
            ) : null}
          </li>
        ))}
      </ol>
      <p className="mt-5 text-sm leading-6 text-muted-foreground">
        Governance principle: recommendations and drafts never bypass permissions, confirmations, or approval
        gates — execution only follows supported runtime paths.
      </p>
    </div>
  );
}
