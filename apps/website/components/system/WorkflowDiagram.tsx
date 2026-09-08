"use client";

import { ARCHITECTURE_LAYERS } from "@/lib/product-ia";

type WorkflowDiagramProps = {
  className?: string;
  compact?: boolean;
};

export function WorkflowDiagram({ className = "", compact = false }: WorkflowDiagramProps) {
  return (
    <div className={`w-full ${className}`} aria-label="RINADS platform architecture">
      <ol className={`flex ${compact ? "flex-wrap gap-2" : "flex-col gap-3 md:flex-row md:flex-wrap md:gap-3"}`}>
        {ARCHITECTURE_LAYERS.map((layer, index) => (
          <li key={layer.id} className="flex items-stretch gap-3 md:items-center">
            <div className="min-w-0 flex-1 border border-rinads-primary/25 bg-black/40 px-4 py-3 md:min-w-[140px] md:flex-none">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rinads-primary">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">{layer.label}</p>
              {!compact ? (
                <p className="mt-1 text-xs text-muted-foreground">{layer.description}</p>
              ) : null}
            </div>
            {index < ARCHITECTURE_LAYERS.length - 1 ? (
              <span className="hidden text-rinads-primary/60 md:inline" aria-hidden>
                →
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
