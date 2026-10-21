import { can, isAvailable, type ReceivableRow } from "@rinads/company-os-engine";
import { ActionForm } from "@/components/os/company/ActionForm";
import { guard } from "@/components/os/company/guard";
import { QuickAction } from "@/components/os/company/QuickAction";
import { Badge, LinkButton, Metric, MetricGrid, OsPage, Panel, SectionGate, Table } from "@/components/os/company/ui";
import { formatDate, formatMoney, titleCase } from "@/lib/company-os/format";
import { companyOptions, projectOptions } from "@/lib/company-os/options";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const g = await guard("/os/finance", "finance.read", "Finance");
  if (!g.ok) return g.block;
  const { facts, snapshot, session } = g.data;
  const manage = can(session.ctx, "finance.write");

  return (
    <OsPage
      title="Finance"
      eyebrow="Money"
      summary="Receivables, invoices and recorded payments. Revenue here is cash-basis from recorded payments only — not accounting revenue and not a bank balance."
      actions={<LinkButton href="/os/money">Commerce money tools</LinkButton>}
    >
      <Panel id="summary" title="This month" subtitle="Cash basis, India time">
        <SectionGate section={snapshot.cash} label="Cash">
          {(cash) => (
            <>
              <MetricGrid>
                <Metric label="Received" value={formatMoney(cash.receivedThisPeriod)} hint={`Previous month ${formatMoney(cash.receivedPreviousPeriod)}`} />
                <Metric label="Expenses" value={cash.expensesThisPeriod === null ? "Not recorded" : formatMoney(cash.expensesThisPeriod)} />
                <Metric label="Net cash movement" value={cash.netCashMovement === null ? "Unknown" : formatMoney(cash.netCashMovement)} />
                {isAvailable(snapshot.receivables) && <Metric label="Outstanding" value={formatMoney(snapshot.receivables.data.totalOutstanding)} hint={`${formatMoney(snapshot.receivables.data.totalOverdue)} overdue`} tone={snapshot.receivables.data.overdueCount > 0 ? "warn" : undefined} />}
              </MetricGrid>
              <p className="mt-3 text-xs text-gray-500">{cash.basis}</p>
            </>
          )}
        </SectionGate>
      </Panel>

      <Panel id="receivables" title="Receivables" subtitle="Outstanding on issued and part-paid invoices">
        <SectionGate section={snapshot.receivables} label="Receivables">
          {(r) => (
            <>
              {r.mixedCurrency && <p role="note" className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">Invoices are in more than one currency ({r.currencies.join(", ")}); totals above add nominal amounts and are not converted.</p>}
              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {(Object.entries(r.buckets) as [string, number][]).map(([bucket, amount]) => (
                  <Metric key={bucket} label={bucket === "current" ? "Not yet due" : `${bucket} days`} value={formatMoney(amount)} tone={bucket === "90+" && amount > 0 ? "bad" : undefined} />
                ))}
              </div>
              <Table
                caption="Receivables"
                rows={r.rows}
                columns={[
                  { header: "Invoice", cell: (x: ReceivableRow) => <>{x.invoice.number}{x.invoice.companyName ? <span className="text-gray-500"> · {x.invoice.companyName}</span> : null}</> },
                  { header: "Due", cell: (x) => formatDate(x.invoice.dueDate) },
                  { header: "Status", cell: (x) => <Badge tone={x.overdue ? "bad" : "neutral"}>{x.overdue ? `${x.daysOverdue}d overdue` : titleCase(x.invoice.status)}</Badge> },
                  { header: "Total", cell: (x) => formatMoney(x.invoice.total, x.invoice.currency) },
                  { header: "Outstanding", cell: (x) => formatMoney(x.outstanding, x.invoice.currency) },
                ]}
              />
            </>
          )}
        </SectionGate>
      </Panel>

      <Panel id="invoices" title="Invoices" subtitle="Issuing or voiding is HIGH risk: another approver must approve. Recording a payment is approved before the balance changes.">
        <SectionGate section={facts.invoices} label="Invoices">
          {(invoices) => (
            <Table
              caption="Invoices"
              rows={invoices.filter((i) => i.status !== "paid")}
              columns={[
                { header: "Invoice", cell: (i) => <>{i.number}{i.companyName ? <span className="text-gray-500"> · {i.companyName}</span> : null}</> },
                { header: "Status", cell: (i) => <Badge tone={i.status === "draft" ? "neutral" : "info"}>{titleCase(i.status)}</Badge> },
                { header: "Due", cell: (i) => formatDate(i.dueDate) },
                { header: "Total", cell: (i) => formatMoney(i.total, i.currency) },
                {
                  header: "Actions",
                  cell: (i) =>
                    manage ? (
                      <div className="flex flex-wrap gap-2">
                        {i.status === "draft" && <QuickAction actionKey="invoice.issue" input={{ invoiceId: i.id }} label="Issue (needs approval)" />}
                        {i.status === "issued" && <QuickAction actionKey="invoice.void" input={{ invoiceId: i.id, reason: "Voided from Finance" }} label="Void (needs approval)" />}
                      </div>
                    ) : null,
                },
              ]}
            />
          )}
        </SectionGate>
        {manage && (
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <ActionForm
              actionKey="invoice.create_draft"
              title="Draft an invoice"
              submitLabel="Create draft"
              fields={[
                { name: "companyId", label: "Company", kind: "select", options: companyOptions(facts) },
                { name: "projectId", label: "Project", kind: "select", options: projectOptions(facts) },
                { name: "dueDate", label: "Due date", kind: "date", required: true },
                { name: "taxRatePct", label: "Tax %", kind: "number", step: "0.01" },
                { name: "lineItems", label: "Lines (description | qty | unit price, one per line)", kind: "lines", required: true },
              ]}
            />
            {isAvailable(facts.invoices) && (
              <ActionForm
                actionKey="payment.record"
                title="Record a payment received"
                submitLabel="Request approval to record payment"
                fields={[
                  { name: "invoiceId", label: "Invoice", kind: "select", required: true, options: facts.invoices.data.filter((i) => i.status === "issued" || i.status === "partially_paid").map((i) => ({ value: i.id, label: `${i.number} — ${formatMoney(i.total, i.currency)}` })) },
                  { name: "amount", label: "Amount received", kind: "number", required: true, step: "0.01" },
                  { name: "method", label: "Method", kind: "select", options: ["bank_transfer", "upi", "card", "cash", "cheque", "other"].map((m) => ({ value: m, label: titleCase(m) })) },
                  { name: "reference", label: "Reference" },
                ]}
              />
            )}
          </div>
        )}
      </Panel>
    </OsPage>
  );
}
