"use client";

import { useState } from "react";

export function InvoiceActions({ invoiceNumber }: { invoiceNumber: string }) {
  const [copied, setCopied] = useState(false);

  function printInvoice() {
    window.print();
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function downloadHtml() {
    const invoice = document.getElementById("gst-invoice");
    if (!invoice) return;
    const blob = new Blob(
      [
        `<!doctype html><html><head><meta charset="utf-8"><title>${invoiceNumber}</title></head><body>${invoice.outerHTML}</body></html>`,
      ],
      { type: "text/html" }
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${invoiceNumber}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="invoice-actions flex flex-wrap gap-2">
      <button type="button" className="btn-primary text-xs" onClick={printInvoice}>
        Print / Save PDF
      </button>
      <button type="button" className="btn-secondary text-xs" onClick={downloadHtml}>
        Download HTML
      </button>
      <button type="button" className="btn-secondary text-xs" onClick={() => void copyLink()}>
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
