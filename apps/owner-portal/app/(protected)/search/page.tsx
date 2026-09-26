"use client";

import { useState } from "react";
import { Card, Input } from "@rinads/ui";
import { operations, opsContext } from "@/lib/commerce";

export default function SearchPage() {
  const ctx = opsContext();
  const [query, setQuery] = useState("");
  const results = query.length >= 2 ? operations.search.search(ctx, query) : [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">ERP search</h2>
      <Input placeholder="Search suppliers, POs, tasks…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <Card>
        {results.length === 0 ? (
          <p className="text-sm text-muted-foreground">Enter at least 2 characters.</p>
        ) : (
          <ul className="divide-y divide-border">
            {results.map((r) => (
              <li key={`${r.type}-${r.id}`} className="py-2 text-sm">
                <span className="text-muted-foreground uppercase text-xs">{r.type}</span>
                <p className="font-medium">{r.title}</p>
                {r.subtitle ? <p className="text-muted-foreground">{r.subtitle}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
