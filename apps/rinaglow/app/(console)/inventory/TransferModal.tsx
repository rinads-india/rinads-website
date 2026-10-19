"use client";

import type { SalonBranch, SalonProduct, SalonStockLevel } from "@rinads/salon";
import { quantityForBranch, suggestTransferRoute } from "@rinads/salon";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { transferStockAction } from "./actions";

function transferKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `xfer-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function TransferModal({
  branches,
  products,
  levels,
  currentBranchId,
}: {
  branches: SalonBranch[];
  products: SalonProduct[];
  levels: SalonStockLevel[];
  currentBranchId?: string;
}) {
  const suggested = suggestTransferRoute(products, levels, branches, currentBranchId);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [fromId, setFromId] = useState(suggested.fromBranchId ?? branches[0]?.id ?? "");
  const [toId, setToId] = useState(suggested.toBranchId ?? branches[1]?.id ?? "");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fromName = branches.find((branch) => branch.id === fromId)?.name ?? "Source";
  const toName = branches.find((branch) => branch.id === toId)?.name ?? "Destination";
  const lines = useMemo(
    () =>
      Object.entries(qty)
        .map(([productId, quantity]) => ({ productId, quantity }))
        .filter((line) => line.quantity > 0),
    [qty]
  );

  if (branches.length < 2) return null;

  function reset() {
    setStep(0);
    setQty({});
    setError(null);
    setFromId(suggested.fromBranchId ?? branches[0]?.id ?? "");
    setToId(suggested.toBranchId ?? branches[1]?.id ?? "");
  }

  function confirm() {
    setError(null);
    const form = new FormData();
    form.set("fromBranchId", fromId);
    form.set("toBranchId", toId);
    form.set("lines", JSON.stringify(lines));
    form.set("idempotencyKey", transferKey());
    startTransition(async () => {
      const result = await transferStockAction(undefined, form);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      reset();
    });
  }

  return (
    <>
      <button type="button" className="btn-primary text-xs" onClick={() => setOpen(true)}>
        Stock transfer
      </button>
      {open ? (
        <div className="inv-modal-root">
          <button type="button" className="inv-modal-backdrop" aria-label="Close transfer" onClick={() => setOpen(false)} />
          <div className="inv-modal" role="dialog" aria-labelledby="stock-transfer-title">
            <div className="flex items-start justify-between gap-3 border-b border-rinads-primary/10 px-5 py-4">
              <div>
                <h3 id="stock-transfer-title" className="text-base font-semibold text-foreground">
                  Stock transfer
                </h3>
                <p className="text-xs text-muted-foreground">Move inventory between your stores</p>
              </div>
              <button type="button" className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <div className="flex gap-2 border-b border-rinads-primary/10 px-5 py-3 text-xs font-semibold">
              {["Stores", "Products", "Review"].map((label, index) => (
                <span key={label} className={index === step ? "text-rinads-primary" : "text-muted-foreground"}>
                  {index + 1}. {label}
                </span>
              ))}
            </div>
            <div className="space-y-4 px-5 py-5">
              {step === 0 ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                    <label className="field-label">
                      From store
                      <select className="field-input mt-1" value={fromId} onChange={(event) => { setFromId(event.target.value); setQty({}); }}>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                      </select>
                    </label>
                    <p className="hidden pb-2 text-center text-rinads-primary sm:block">→</p>
                    <label className="field-label">
                      To store
                      <select className="field-input mt-1" value={toId} onChange={(event) => { setToId(event.target.value); setQty({}); }}>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>{branch.name}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="rinpo-brief">
                    <Image src="/assets/rinpo-face.png" alt="RINPO" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                    <p className="text-xs text-foreground">
                      <span className="font-semibold">RINPO:</span>{" "}
                      {suggested.lowCount
                        ? `${toName} is low on ${suggested.lowCount} item${suggested.lowCount === 1 ? "" : "s"} that ${fromName} can cover. I pre-selected this route.`
                        : `${toName} is stocked. Choose a route if you still need to move units.`}
                    </p>
                  </div>
                </>
              ) : null}
              {step === 1 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Pick quantities to move from <span className="font-semibold text-foreground">{fromName}</span> →{" "}
                    <span className="font-semibold text-foreground">{toName}</span>
                  </p>
                  {products.map((product) => {
                    const available = quantityForBranch(levels, product.id, fromId);
                    return (
                      <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl border border-rinads-primary/10 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{product.name}</p>
                          <p className="text-[11px] text-muted-foreground">{available} at source</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn-secondary px-2 py-1 text-xs"
                            onClick={() => setQty((current) => ({ ...current, [product.id]: Math.max(0, (current[product.id] ?? 0) - 1) }))}
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">{qty[product.id] ?? 0}</span>
                          <button
                            type="button"
                            className="btn-secondary px-2 py-1 text-xs"
                            onClick={() =>
                              setQty((current) => ({
                                ...current,
                                [product.id]: Math.min(available, (current[product.id] ?? 0) + 1),
                              }))
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              {step === 2 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Route <span className="font-semibold text-foreground">{fromName} → {toName}</span>
                  </p>
                  {lines.map((line) => {
                    const product = products.find((item) => item.id === line.productId);
                    return (
                      <div key={line.productId} className="flex justify-between text-sm">
                        <span>{product?.name ?? line.productId}</span>
                        <span className="font-semibold">{line.quantity}</span>
                      </div>
                    );
                  })}
                  <p className="pt-2 text-base font-semibold text-foreground">
                    Total units {lines.reduce((sum, line) => sum + line.quantity, 0)}
                  </p>
                </div>
              ) : null}
              {error ? <p className="text-xs text-danger">{error}</p> : null}
            </div>
            <div className="flex items-center justify-between border-t border-rinads-primary/10 px-5 py-4">
              <button type="button" className="text-xs text-muted-foreground" onClick={() => (step === 0 ? setOpen(false) : setStep(step - 1))}>
                {step === 0 ? "Cancel" : "Back"}
              </button>
              {step < 2 ? (
                <button
                  type="button"
                  className="btn-primary text-xs"
                  disabled={step === 0 ? fromId === toId : lines.length === 0}
                  onClick={() => setStep(step + 1)}
                >
                  {step === 0 ? "Choose products" : "Review"}
                </button>
              ) : (
                <button type="button" className="btn-primary text-xs" disabled={isPending || lines.length === 0} onClick={confirm}>
                  {isPending ? "Transferring…" : "Confirm transfer"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
