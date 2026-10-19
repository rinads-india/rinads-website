import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";

const root = process.cwd();

describe("R GLOW GST invoices", () => {
  it("prints a GST invoice from POS sales and stores GSTIN in settings", () => {
    const pos = readFileSync(join(root, "app/(console)/pos/SaleCard.tsx"), "utf8");
    const invoice = readFileSync(join(root, "app/(console)/pos/invoices/[saleId]/page.tsx"), "utf8");
    const settings = readFileSync(join(root, "app/(console)/settings/page.tsx"), "utf8");
    const actions = readFileSync(join(root, "app/(console)/pos/invoices/InvoiceActions.tsx"), "utf8");
    assert.match(pos, /\/pos\/invoices\/\$\{sale\.id\}/);
    assert.match(invoice, /buildGstInvoice/);
    assert.match(invoice, /Tax invoice/);
    assert.match(invoice, /getBillingSettings/);
    assert.match(settings, /GstinSettingsForm/);
    assert.match(actions, /Print \/ Save PDF/);
    assert.match(actions, /Download HTML/);
    assert.doesNotMatch(invoice, /demoContext|USE_DEMO_STORE|Ringlow/);
  });
});
