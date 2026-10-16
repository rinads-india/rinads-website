"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { submitOsAction } from "@/lib/company-os/actions";
import { IDLE, type OsActionState } from "@/lib/company-os/action-state";

export type FieldKind = "text" | "number" | "date" | "textarea" | "select" | "checkbox" | "csv" | "lines" | "skills";
export type Field = {
  name: string;
  label: string;
  kind?: FieldKind;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string;
  step?: string;
};

function parseLines(text: string): { description: string; quantity: number; unitPrice: number }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [description, qty, price] = l.split("|").map((s) => s.trim());
      return { description: description ?? "", quantity: Number(qty ?? 1), unitPrice: Number(price ?? 0) };
    });
}

function parseSkills(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const part of text.split(",").map((s) => s.trim()).filter(Boolean)) {
    const [k, v] = part.split(":").map((s) => s.trim());
    if (k) out[k.toLowerCase().replaceAll(" ", "_")] = Number(v);
  }
  return out;
}

/** Collects the typed values into the action input. Empty optional fields are omitted. */
function collect(fields: Field[], data: FormData, fixed: Record<string, unknown>): Record<string, unknown> {
  const input: Record<string, unknown> = { ...fixed };
  for (const f of fields) {
    const kind = f.kind ?? "text";
    if (kind === "checkbox") {
      input[f.name] = data.get(f.name) === "on";
      continue;
    }
    const raw = String(data.get(f.name) ?? "").trim();
    if (raw === "") continue;
    if (kind === "number") input[f.name] = Number(raw);
    else if (kind === "csv") input[f.name] = raw.split(",").map((s) => s.trim()).filter(Boolean);
    else if (kind === "lines") input[f.name] = parseLines(raw);
    else if (kind === "skills") input[f.name] = parseSkills(raw);
    else input[f.name] = raw;
  }
  return input;
}

const STATUS_STYLE: Record<OsActionState["status"], string> = {
  idle: "",
  executed: "bg-emerald-50 text-emerald-900",
  approval_required: "bg-sky-50 text-sky-900",
  denied: "bg-red-50 text-red-900",
  failed: "bg-red-50 text-red-900",
  rejected: "bg-amber-50 text-amber-900",
};

/**
 * One generic, accessible form for every governed action. The browser only proposes an action key
 * and input; the server decides everything (tenant, role, permission, risk, approval).
 */
export function ActionForm({
  actionKey,
  title,
  submitLabel,
  fields,
  fixed = {},
  compact = false,
}: {
  actionKey: string;
  title?: string;
  submitLabel: string;
  fields: Field[];
  fixed?: Record<string, unknown>;
  compact?: boolean;
}) {
  const [state, dispatch, pending] = useActionState(submitOsAction, IDLE);
  const formRef = useRef<HTMLFormElement>(null);
  const [key, setKey] = useState(() => globalThis.crypto.randomUUID());

  // The payload is built from the submitted FormData inside the action itself (never from stale state).
  function formAction(data: FormData) {
    data.set("input", JSON.stringify(collect(fields, data, fixed)));
    data.set("idempotencyKey", key);
    dispatch(data);
  }

  // A new idempotency key after a completed request keeps double-clicks safe but allows the next intentional submit.
  useEffect(() => {
    if (state.status === "executed" || state.status === "approval_required") {
      formRef.current?.reset();
      setKey(globalThis.crypto.randomUUID());
    }
  }, [state]);

  const id = useMemo(() => `af-${actionKey.replace(/\W/g, "-")}-${Math.random().toString(36).slice(2, 7)}`, [actionKey]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={`flex flex-col gap-3 ${compact ? "" : "rounded-2xl bg-white/50 p-4"}`}
      aria-labelledby={title ? `${id}-t` : undefined}
    >
      {title && <h3 id={`${id}-t`} className="text-sm font-semibold text-gray-900">{title}</h3>}
      <input type="hidden" name="actionKey" value={actionKey} />
      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        {fields.map((f) => {
          const kind = f.kind ?? "text";
          const fid = `${id}-${f.name}`;
          const common = { id: fid, name: f.name, required: f.required, placeholder: f.placeholder, defaultValue: f.defaultValue, "aria-describedby": f.help ? `${fid}-h` : undefined };
          const cls = "min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900";
          return (
            <div key={f.name} className={kind === "textarea" || kind === "lines" ? "sm:col-span-2" : ""}>
              {kind !== "checkbox" && <label htmlFor={fid} className="mb-1 block text-xs font-medium text-gray-700">{f.label}{f.required ? <span aria-hidden> *</span> : null}</label>}
              {kind === "textarea" || kind === "lines" ? (
                <textarea {...common} rows={kind === "lines" ? 4 : 3} className={cls} />
              ) : kind === "select" ? (
                <select {...common} className={cls}>
                  <option value="">{f.required ? "Select…" : "—"}</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : kind === "checkbox" ? (
                <label className="flex min-h-11 items-center gap-2 text-sm text-gray-800">
                  <input type="checkbox" name={f.name} defaultChecked={f.defaultValue === "on"} className="h-4 w-4" /> {f.label}
                </label>
              ) : (
                <input {...common} type={kind === "number" ? "number" : kind === "date" ? "date" : "text"} step={kind === "number" ? (f.step ?? "any") : undefined} className={cls} />
              )}
              {f.help && <p id={`${fid}-h`} className="mt-1 text-[11px] text-gray-500">{f.help}</p>}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center rounded-xl bg-black px-4 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Working…" : submitLabel}
        </button>
        <p role="status" aria-live="polite" className={`rounded-xl px-3 py-2 text-xs ${state.message ? STATUS_STYLE[state.status] : ""}`}>
          {state.message}
          {state.status === "approval_required" && (
            <>
              {" "}
              <a href="/os/approvals" className="font-semibold underline">Open approvals</a>
            </>
          )}
        </p>
      </div>
    </form>
  );
}
