import { Card, EmptyState } from "@rinads/ui";
import { buildGstInvoice } from "@rinads/salon";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSalonRepository } from "@/lib/salon";
import { requireTenancy } from "@/lib/tenancy";
import { InvoiceActions } from "../InvoiceActions";

export const metadata = { title: "GST invoice — R GLOW Console" };

function money(currency: string, amount: number): string {
  return `${currency} ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function GstInvoicePage({ params }: { params: Promise<{ saleId: string }> }) {
  const tenancy = await requireTenancy();
  const { saleId } = await params;
  const repo = await getSalonRepository();
  const saleResult = await repo.getSale(saleId);
  if (!saleResult.ok || saleResult.data.organizationId !== tenancy.organizationId) notFound();
  const sale = saleResult.data;
  if (sale.status === "draft" || sale.status === "void") {
    return (
      <EmptyState
        title="Invoice not ready"
        description="Finalize the sale in POS before printing a GST invoice."
      />
    );
  }

  const [billingResult, branchesResult, customersResult, paymentsResult] = await Promise.all([
    repo.getBillingSettings(tenancy.organizationId),
    repo.listBranches(tenancy.organizationId),
    sale.customerId ? repo.listCustomers(tenancy.organizationId) : Promise.resolve({ ok: true as const, data: [] }),
    repo.listPaymentsForSale(sale.id),
  ]);

  const branch = (branchesResult.ok ? branchesResult.data : []).find((item) => item.id === sale.branchId);
  if (!branch) notFound();
  const customer = sale.customerId
    ? (customersResult.ok ? customersResult.data : []).find((item) => item.id === sale.customerId)
    : undefined;
  const invoice = buildGstInvoice({
    sale,
    branch,
    billing: billingResult.ok ? billingResult.data : { legalName: "", gstin: "", stateName: "", stateCode: "", sacCode: "9997" },
    organizationName:
      tenancy.memberships.find((membership) => membership.organizationId === tenancy.organizationId)?.organizationName ?? "R GLOW",
    customer,
    payments: paymentsResult.ok ? paymentsResult.data : [],
    invoiceDate: sale.updatedAt ?? sale.createdAt,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-rinads-primary">
            <Link href="/pos">POS</Link> · GST tax invoice
          </p>
          <h2 className="text-2xl font-semibold text-foreground">{invoice.invoiceNumber}</h2>
        </div>
        <InvoiceActions invoiceNumber={invoice.invoiceNumber} />
      </div>

      {invoice.missingGstin ? (
        <Card>
          <p className="text-sm text-amber-800">
            Add the salon GSTIN in Settings before using this as a tax invoice. Totals below still come from the live POS sale.
          </p>
        </Card>
      ) : null}

      <article id="gst-invoice" className="gst-invoice">
        <header className="gst-invoice-head">
          <div>
            <p className="gst-kicker">Tax invoice</p>
            <h1>{invoice.seller.legalName}</h1>
            <p>{invoice.seller.tradeName}</p>
            <p>{invoice.seller.address}</p>
            {invoice.seller.phone ? <p>Phone: {invoice.seller.phone}</p> : null}
          </div>
          <div className="gst-invoice-meta">
            <p>
              <span>Invoice no.</span> {invoice.invoiceNumber}
            </p>
            <p>
              <span>Date</span>{" "}
              {new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
            <p>
              <span>GSTIN</span> {invoice.seller.gstin || "—"}
            </p>
            {invoice.seller.pan ? (
              <p>
                <span>PAN</span> {invoice.seller.pan}
              </p>
            ) : null}
            <p>
              <span>Place of supply</span> {invoice.placeOfSupply || "—"}
            </p>
            <p>
              <span>Reverse charge</span> No
            </p>
          </div>
        </header>

        <section className="gst-invoice-parties">
          <div>
            <p className="gst-kicker">Bill to</p>
            <p className="font-semibold">{invoice.buyer.name}</p>
            {invoice.buyer.phone ? <p>{invoice.buyer.phone}</p> : null}
          </div>
        </section>

        <table className="gst-invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th>SAC</th>
              <th>Qty</th>
              <th>Taxable</th>
              <th>GST %</th>
              <th>CGST</th>
              <th>SGST</th>
              <th>IGST</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line, index) => (
              <tr key={`${line.description}-${index}`}>
                <td>{index + 1}</td>
                <td>{line.description}</td>
                <td>{line.hsnSac}</td>
                <td>{line.quantity}</td>
                <td>{money(invoice.currency, line.taxableValue)}</td>
                <td>{line.taxRatePct}</td>
                <td>{money(invoice.currency, line.tax.cgst)}</td>
                <td>{money(invoice.currency, line.tax.sgst)}</td>
                <td>{money(invoice.currency, line.tax.igst)}</td>
                <td>{money(invoice.currency, line.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="gst-invoice-totals">
          <p>Taxable value: {money(invoice.currency, invoice.taxableValue)}</p>
          {invoice.discountTotal > 0 ? <p>Discount: {money(invoice.currency, invoice.discountTotal)}</p> : null}
          {invoice.tax.intraState ? (
            <>
              <p>CGST: {money(invoice.currency, invoice.tax.cgst)}</p>
              <p>SGST: {money(invoice.currency, invoice.tax.sgst)}</p>
            </>
          ) : (
            <p>IGST: {money(invoice.currency, invoice.tax.igst)}</p>
          )}
          <p className="gst-grand-total">Total: {money(invoice.currency, invoice.total)}</p>
          <p className="gst-words">{invoice.amountInWords}</p>
          {invoice.payments.length ? (
            <p>
              Paid:{" "}
              {invoice.payments
                .map((payment) => `${payment.method.toUpperCase()} ${money(invoice.currency, payment.amount)}`)
                .join(", ")}
            </p>
          ) : (
            <p>Payment: awaiting collection</p>
          )}
        </section>

        <footer className="gst-invoice-foot">
          <p>This is a computer-generated tax invoice from R GLOW Salon OS. No signature is required.</p>
        </footer>
      </article>
    </div>
  );
}
