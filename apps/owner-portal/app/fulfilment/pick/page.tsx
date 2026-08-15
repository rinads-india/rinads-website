"use client";

import { useState } from "react";
import { Card, Input, Button } from "@rinads/ui";
import { commerce, operations, opsContext } from "@/lib/commerce";

export default function PickPage() {
  const ctx = opsContext();
  const [sku, setSku] = useState("");
  const [message, setMessage] = useState("");

  const pending = operations.fulfilment.list(ctx).filter((f) =>
    ["pending", "picking"].includes(f.status)
  );

  function lookupSku() {
    const variant = commerce.repo.getStore().variants.find((v) => v.sku === sku.trim());
    if (!variant) {
      setMessage("SKU not found.");
      return;
    }
    const balance = operations.ledger.getBalance(ctx, variant.id);
    setMessage(`${variant.name}: ${balance.available} available at default location`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-xl font-semibold">Pick (mobile)</h2>
      <Card className="space-y-3">
        <Input placeholder="Scan or enter SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
        <Button onClick={lookupSku}>Check stock</Button>
        {message ? <p className="text-sm">{message}</p> : null}
      </Card>
      <Card>
        <p className="text-sm font-medium">Open pick tasks: {pending.length}</p>
      </Card>
    </div>
  );
}
