import { INVOICE_MACHINE, canTransition, round2, type DomainTool } from "@rinads/company-os-engine";
import { ToolError, afterWrite, defineTool, evt, insertOne, mustRead, nowIso, readMany, todayIso, updateOne, verifyRow, type Env } from "../kit";
import { InputError, date, num, oneOf, reqStr, reqUuid, str, uuid, type Input } from "../validate";

const METHOD = ["bank_transfer", "upi", "card", "cash", "cheque", "other"] as const;

type LineItem = { description: string; quantity: number; unitPrice: number };

function lineItems(input: Input): LineItem[] {
  const raw = input.lineItems;
  if (!Array.isArray(raw) || raw.length === 0) throw new InputError("lineItems must contain at least one line");
  if (raw.length > 100) throw new InputError("lineItems has too many lines");
  return raw.map((l, i) => {
    const o = l as Record<string, unknown>;
    const description = typeof o.description === "string" ? o.description.trim() : "";
    const quantity = Number(o.quantity);
    const unitPrice = Number(o.unitPrice);
    if (!description) throw new InputError(`Line ${i + 1}: description is required`);
    if (!Number.isFinite(quantity) || quantity <= 0) throw new InputError(`Line ${i + 1}: quantity must be positive`);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new InputError(`Line ${i + 1}: unit price must not be negative`);
    return { description: description.slice(0, 300), quantity, unitPrice };
  });
}

export function priceInvoice(items: readonly LineItem[], taxRatePct: number): { subtotal: number; taxTotal: number; total: number } {
  const subtotal = round2(items.reduce((s, l) => s + l.quantity * l.unitPrice, 0));
  const taxTotal = round2((subtotal * taxRatePct) / 100);
  return { subtotal, taxTotal, total: round2(subtotal + taxTotal) };
}

async function paidSoFar(env: Env, org: string, invoiceId: string): Promise<number> {
  const rows = await readMany(env, "finance_payments", { organization_id: org, invoice_id: invoiceId }, "amount", 5000);
  return round2(rows.reduce((s, r) => s + Number(r.amount), 0));
}

export function financeTools(env: Env): DomainTool[] {
  return [
    defineTool(
      {
        key: "invoice.create_draft",
        async run(ctx, input) {
          const companyId = uuid(input, "companyId", true);
          const projectId = uuid(input, "projectId", true);
          const contractId = uuid(input, "contractId", true);
          if (companyId) await mustRead(env, "crm_companies", ctx.organizationId, companyId, "Company", "id");
          if (projectId) await mustRead(env, "projects", ctx.organizationId, projectId, "Project", "id");
          if (contractId) await mustRead(env, "crm_contracts", ctx.organizationId, contractId, "Contract", "id");
          const items = lineItems(input);
          const taxRate = num(input, "taxRatePct", { optional: true, min: 0, max: 100 }) ?? 0;
          const price = priceInvoice(items, taxRate);
          if (price.total <= 0) throw new ToolError("An invoice total must be greater than zero.");
          // Deterministic per action ⇒ a retry can never create a second invoice number.
          const number = str(input, "number", { optional: true, max: 40 }) ?? `INV-${todayIso(env).replaceAll("-", "")}-${ctx.actionId.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
          const row = await insertOne(env, "finance_invoices", {
            organization_id: ctx.organizationId,
            number,
            company_id: companyId,
            project_id: projectId,
            contract_id: contractId,
            due_date: date(input, "dueDate"),
            subtotal: price.subtotal,
            tax_total: price.taxTotal,
            total: price.total,
            currency: str(input, "currency", { optional: true, max: 3 }) ?? "INR",
            line_items: items,
            notes: str(input, "notes", { optional: true, max: 2000 }),
          });
          return { id: row.id, number, total: price.total, status: "draft" };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "finance_invoices", ctx.organizationId, String(out.id), { status: "draft", total: out.total, number: out.number });
        },
      },
      env
    ),

    // HIGH — approved ledger row required (pipeline + database).
    defineTool(
      {
        key: "invoice.issue",
        async run(ctx, input) {
          const id = reqUuid(input, "invoiceId");
          const inv = await mustRead(env, "finance_invoices", ctx.organizationId, id, "Invoice");
          const t = canTransition(INVOICE_MACHINE, inv.status as never, "issued");
          if (!t.ok) throw new ToolError(t.reason, "invalid_transition");
          if (!(Number(inv.total) > 0)) throw new ToolError("Cannot issue an invoice with a zero total.");
          if (!inv.due_date) throw new ToolError("Set a due date before issuing.");
          await updateOne(env, "finance_invoices", ctx.organizationId, id, { status: "issued", issue_date: todayIso(env), issue_action_id: ctx.actionId });
          return { id, number: inv.number, status: "issued", issueActionId: ctx.actionId, total: Number(inv.total) };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "finance_invoices", ctx.organizationId, String(out.id), { status: "issued", issue_action_id: out.issueActionId });
        },
        events: (ctx, _i, out) => [evt(ctx, "invoice.issued.v1", "finance_invoice", String(out.id), { number: out.number, total: out.total })],
      },
      env
    ),

    defineTool(
      {
        key: "invoice.void",
        async run(ctx, input) {
          const id = reqUuid(input, "invoiceId");
          const inv = await mustRead(env, "finance_invoices", ctx.organizationId, id, "Invoice");
          const t = canTransition(INVOICE_MACHINE, inv.status as never, "void");
          if (!t.ok) throw new ToolError(t.reason, "invalid_transition");
          if ((await paidSoFar(env, ctx.organizationId, id)) > 0) throw new ToolError("An invoice with recorded payments cannot be voided.", "invalid_state");
          reqStr(input, "reason", { max: 500 });
          await updateOne(env, "finance_invoices", ctx.organizationId, id, { status: "void", void_action_id: ctx.actionId });
          return { id, status: "void", voidActionId: ctx.actionId };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "finance_invoices", ctx.organizationId, String(out.id), { status: "void", void_action_id: out.voidActionId });
        },
      },
      env
    ),

    // HIGH/CRITICAL — records money received. One approval authorises exactly one payment (DB unique).
    defineTool(
      {
        key: "payment.record",
        async run(ctx, input) {
          const invoiceId = reqUuid(input, "invoiceId");
          const amount = num(input, "amount", { min: 0.01 })!;
          const inv = await mustRead(env, "finance_invoices", ctx.organizationId, invoiceId, "Invoice");
          if (inv.status !== "issued" && inv.status !== "partially_paid") throw new ToolError("Payments can only be recorded against an issued invoice.", "invalid_state");
          const paid = await paidSoFar(env, ctx.organizationId, invoiceId);
          const outstanding = round2(Number(inv.total) - paid);
          if (amount > outstanding + 0.005) throw new ToolError(`Amount exceeds the outstanding balance (${outstanding}).`);
          const payment = await insertOne(env, "finance_payments", {
            organization_id: ctx.organizationId,
            invoice_id: invoiceId,
            amount: round2(amount),
            currency: inv.currency,
            received_at: date(input, "receivedAt") ?? nowIso(env),
            method: oneOf(input, "method", METHOD, true) ?? "bank_transfer",
            reference: str(input, "reference", { optional: true, max: 120 }),
            approved_action_id: ctx.actionId,
          });
          const newPaid = round2(paid + amount);
          const status = newPaid + 0.005 >= Number(inv.total) ? "paid" : "partially_paid";
          await afterWrite(() => updateOne(env, "finance_invoices", ctx.organizationId, invoiceId, { status }), "Updating the invoice status");
          return { paymentId: payment.id, invoiceId, amount: round2(amount), invoiceStatus: status, outstanding: round2(Number(inv.total) - newPaid) };
        },
        async verify(ctx, _i, out) {
          await verifyRow(env, "finance_payments", ctx.organizationId, String(out.paymentId), { amount: out.amount, invoice_id: out.invoiceId });
          await verifyRow(env, "finance_invoices", ctx.organizationId, String(out.invoiceId), { status: out.invoiceStatus });
          const paid = await paidSoFar(env, ctx.organizationId, String(out.invoiceId));
          const inv = await mustRead(env, "finance_invoices", ctx.organizationId, String(out.invoiceId), "Invoice", "total");
          if (round2(Number(inv.total) - paid) !== Number(out.outstanding)) throw new ToolError("Outstanding balance does not reconcile with recorded payments.", "verification_error");
        },
        events: (ctx, _i, out) => [evt(ctx, "payment.received.v1", "finance_payment", String(out.paymentId), { invoiceId: out.invoiceId, amount: out.amount })],
      },
      env
    ),
  ];
}
