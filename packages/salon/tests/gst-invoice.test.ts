import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  amountInIndianWords,
  buildGstInvoice,
  isValidGstin,
  parseSalonBillingSettings,
  splitGst,
  type SaleWithLines,
} from "../src/index";

const sale: SaleWithLines = {
  id: "sale_1",
  organizationId: "org_1",
  branchId: "branch_1",
  status: "paid",
  saleNumber: "RGLOW-INV-01001",
  subtotal: 3000,
  discountTotal: 0,
  taxTotal: 540,
  total: 3540,
  currency: "INR",
  lines: [
    {
      id: "l1",
      organizationId: "org_1",
      saleId: "sale_1",
      description: "Hair Color",
      quantity: 1,
      unitPrice: 1800,
      discountAmount: 0,
      taxRatePct: 18,
      taxAmount: 324,
      lineTotal: 2124,
    },
    {
      id: "l2",
      organizationId: "org_1",
      saleId: "sale_1",
      description: "Hair Spa",
      quantity: 1,
      unitPrice: 1200,
      discountAmount: 0,
      taxRatePct: 18,
      taxAmount: 216,
      lineTotal: 1416,
    },
  ],
};

const branch = {
  id: "branch_1",
  organizationId: "org_1",
  name: "Thrissur east fort",
  address: "East Fort",
  city: "Thrissur",
  phone: "9074340803",
  timezone: "Asia/Kolkata",
  workingHours: {},
  isActive: true,
  stateName: "Kerala",
  stateCode: "32",
};

describe("GST invoice helpers", () => {
  it("validates GSTIN and splits intra-state tax into CGST/SGST", () => {
    assert.equal(isValidGstin("32AABCK1234A1Z5"), true);
    assert.equal(isValidGstin("32aabck1234a1z5"), true);
    assert.equal(isValidGstin("not-a-gstin"), false);
    assert.deepEqual(splitGst(540, true), { cgst: 270, sgst: 270, igst: 0, intraState: true });
    assert.deepEqual(splitGst(540, false), { cgst: 0, sgst: 0, igst: 540, intraState: false });
  });

  it("reads billing from organization_settings.settings.billing", () => {
    const billing = parseSalonBillingSettings({
      billing: { legalName: "FAB Signature Salon", gstin: "32aabck1234a1z5", stateName: "Kerala" },
    });
    assert.equal(billing.gstin, "32AABCK1234A1Z5");
    assert.equal(billing.stateCode, "32");
    assert.equal(billing.sacCode, "9997");
  });

  it("builds a GST invoice from a paid POS sale without demo data", () => {
    const invoice = buildGstInvoice({
      sale,
      branch,
      billing: parseSalonBillingSettings({
        billing: { legalName: "FAB Signature Salon", gstin: "32AABCK1234A1Z5", stateName: "Kerala" },
      }),
      organizationName: "FAB",
      customer: {
        id: "c1",
        organizationId: "org_1",
        phone: "9000000001",
        name: "Priya Menon",
        marketingConsent: false,
        preferredChannel: "whatsapp",
      },
      payments: [
        {
          id: "p1",
          organizationId: "org_1",
          saleId: "sale_1",
          method: "upi",
          amount: 3540,
          currency: "INR",
          status: "succeeded",
          idempotencyKey: "pay-1",
        },
      ],
    });
    assert.equal(invoice.invoiceNumber, "RGLOW-INV-01001");
    assert.equal(invoice.seller.gstin, "32AABCK1234A1Z5");
    assert.equal(invoice.tax.cgst, 270);
    assert.equal(invoice.tax.sgst, 270);
    assert.equal(invoice.lines[0]?.hsnSac, "9997");
    assert.equal(invoice.missingGstin, false);
    assert.match(invoice.amountInWords, /three thousand five hundred forty rupees only/i);
    assert.equal(invoice.payments[0]?.method, "upi");
  });

  it("flags invoices that are missing a GSTIN instead of inventing one", () => {
    const invoice = buildGstInvoice({
      sale,
      branch,
      billing: parseSalonBillingSettings({}),
      organizationName: "FAB",
    });
    assert.equal(invoice.missingGstin, true);
    assert.equal(invoice.seller.gstin, "");
  });

  it("converts Indian amounts to words including paise", () => {
    assert.equal(amountInIndianWords(0), "INR zero only");
    assert.equal(amountInIndianWords(1_50_000.5), "INR one lakh fifty thousand rupees and fifty paise only");
  });
});
