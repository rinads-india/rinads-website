import type { SalonBranch, SalonCustomer, SalonPayment, SalonSaleLine, SaleWithLines } from "./types";

export const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const DEFAULT_SALON_SAC_CODE = "9997";

export type SalonBillingSettings = {
  legalName: string;
  gstin: string;
  stateName: string;
  stateCode: string;
  sacCode: string;
  address?: string;
  pan?: string;
};

export type GstTaxSplit = {
  cgst: number;
  sgst: number;
  igst: number;
  intraState: boolean;
};

export type GstInvoiceLine = {
  description: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxableValue: number;
  taxRatePct: number;
  tax: GstTaxSplit;
  lineTotal: number;
};

export type GstInvoice = {
  invoiceNumber: string;
  invoiceDate: string;
  reverseCharge: false;
  seller: {
    legalName: string;
    tradeName: string;
    gstin: string;
    pan?: string;
    address: string;
    city?: string;
    phone?: string;
    stateName: string;
    stateCode: string;
  };
  buyer: {
    name: string;
    phone?: string;
    gstin?: string;
  };
  placeOfSupply: string;
  lines: GstInvoiceLine[];
  taxableValue: number;
  tax: GstTaxSplit;
  discountTotal: number;
  total: number;
  currency: string;
  amountInWords: string;
  payments: { method: string; amount: number; status: string }[];
  missingGstin: boolean;
};

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function isValidGstin(value: string): boolean {
  return GSTIN_PATTERN.test(value.trim().toUpperCase());
}

export function normalizeGstin(value: string): string {
  return value.trim().toUpperCase();
}

export function stateCodeFromGstin(gstin: string): string {
  return normalizeGstin(gstin).slice(0, 2);
}

export function parseSalonBillingSettings(raw: unknown): SalonBillingSettings {
  const bag = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const billing = bag.billing && typeof bag.billing === "object" ? (bag.billing as Record<string, unknown>) : bag;
  const gstin = typeof billing.gstin === "string" ? normalizeGstin(billing.gstin) : "";
  return {
    legalName: typeof billing.legalName === "string" ? billing.legalName.trim() : "",
    gstin,
    stateName: typeof billing.stateName === "string" ? billing.stateName.trim() : "",
    stateCode:
      typeof billing.stateCode === "string" && billing.stateCode.trim()
        ? billing.stateCode.trim()
        : gstin
          ? stateCodeFromGstin(gstin)
          : "",
    sacCode: typeof billing.sacCode === "string" && billing.sacCode.trim() ? billing.sacCode.trim() : DEFAULT_SALON_SAC_CODE,
    address: typeof billing.address === "string" ? billing.address.trim() : undefined,
    pan: typeof billing.pan === "string" ? billing.pan.trim().toUpperCase() : undefined,
  };
}

export function splitGst(taxAmount: number, intraState: boolean): GstTaxSplit {
  const tax = roundMoney(Math.max(0, taxAmount));
  if (!intraState) return { cgst: 0, sgst: 0, igst: tax, intraState: false };
  const cgst = roundMoney(tax / 2);
  return { cgst, sgst: roundMoney(tax - cgst), igst: 0, intraState: true };
}

const ONES = [
  "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function twoDigitWords(n: number): string {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones ? `${TENS[tens]} ${ONES[ones]}` : TENS[tens];
}

function chunkWords(n: number): string {
  if (n === 0) return "";
  if (n < 100) return twoDigitWords(n);
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  return rest ? `${ONES[hundred]} hundred ${twoDigitWords(rest)}` : `${ONES[hundred]} hundred`;
}

/** Indian numbering: crore / lakh / thousand. */
export function amountInIndianWords(amount: number, currency = "INR"): string {
  const rounded = roundMoney(amount);
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);
  if (rupees === 0 && paise === 0) return `${currency} zero only`;

  const crore = Math.floor(rupees / 1_00_00_000);
  const lakh = Math.floor((rupees % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((rupees % 1_00_000) / 1000);
  const hundred = rupees % 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${chunkWords(crore)} crore`);
  if (lakh) parts.push(`${chunkWords(lakh)} lakh`);
  if (thousand) parts.push(`${chunkWords(thousand)} thousand`);
  if (hundred) parts.push(chunkWords(hundred));
  const rupeeWords = parts.join(" ").replace(/\s+/g, " ").trim() || "zero";
  const paiseWords = paise ? ` and ${twoDigitWords(paise)} paise` : "";
  return `${currency} ${rupeeWords} rupees${paiseWords} only`;
}

export function sellerFromBilling(
  billing: SalonBillingSettings,
  branch: SalonBranch,
  organizationName: string
): GstInvoice["seller"] {
  const gstin = (branch.gstin && isValidGstin(branch.gstin) ? normalizeGstin(branch.gstin) : billing.gstin) || "";
  const stateCode = branch.stateCode || billing.stateCode || (gstin ? stateCodeFromGstin(gstin) : "");
  const stateName = branch.stateName || billing.stateName || "";
  const address = [billing.address || branch.address, branch.city].filter(Boolean).join(", ");
  return {
    legalName: billing.legalName || organizationName,
    tradeName: branch.name,
    gstin,
    pan: billing.pan,
    address: address || branch.name,
    city: branch.city,
    phone: branch.phone,
    stateName,
    stateCode,
  };
}

export function buildGstInvoice(input: {
  sale: SaleWithLines;
  payments?: SalonPayment[];
  customer?: SalonCustomer | null;
  branch: SalonBranch;
  billing: SalonBillingSettings;
  organizationName: string;
  invoiceDate?: string;
}): GstInvoice {
  const seller = sellerFromBilling(input.billing, input.branch, input.organizationName);
  const buyerState = seller.stateCode;
  const intraState = !buyerState || buyerState === seller.stateCode;
  const sac = input.billing.sacCode || DEFAULT_SALON_SAC_CODE;

  const lines: GstInvoiceLine[] = (input.sale.lines ?? []).map((line: SalonSaleLine) => {
    const taxableValue = roundMoney(line.quantity * line.unitPrice - line.discountAmount);
    const taxAmount = roundMoney(line.taxAmount);
    return {
      description: line.description,
      hsnSac: sac,
      quantity: line.quantity,
      unitPrice: roundMoney(line.unitPrice),
      discountAmount: roundMoney(line.discountAmount),
      taxableValue,
      taxRatePct: line.taxRatePct,
      tax: splitGst(taxAmount, intraState),
      lineTotal: roundMoney(line.lineTotal || taxableValue + taxAmount),
    };
  });

  const taxableValue = roundMoney(lines.reduce((sum, line) => sum + line.taxableValue, 0));
  const tax = splitGst(input.sale.taxTotal, intraState);
  const invoiceDate = input.invoiceDate ?? input.sale.updatedAt ?? input.sale.createdAt ?? new Date().toISOString();

  return {
    invoiceNumber: input.sale.saleNumber || input.sale.id,
    invoiceDate,
    reverseCharge: false,
    seller,
    buyer: {
      name: input.customer?.name || input.customer?.phone || "Walk-in customer",
      phone: input.customer?.phone,
    },
    placeOfSupply: [seller.stateName, seller.stateCode].filter(Boolean).join(" ") || seller.city || seller.tradeName,
    lines,
    taxableValue,
    tax,
    discountTotal: roundMoney(input.sale.discountTotal),
    total: roundMoney(input.sale.total),
    currency: input.sale.currency,
    amountInWords: amountInIndianWords(input.sale.total, input.sale.currency),
    payments: (input.payments ?? [])
      .filter((payment) => payment.status === "succeeded")
      .map((payment) => ({ method: payment.method, amount: payment.amount, status: payment.status })),
    missingGstin: !isValidGstin(seller.gstin),
  };
}
