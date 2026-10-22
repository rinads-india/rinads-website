import type { LogisticsProviderConfig } from "@rinads/operations";
import { resolveLogisticsCredentialBinding } from "../logistics-secrets";
import {
  ShiprocketApiError,
  ShiprocketClient,
  type ShiprocketClientOptions,
  type ShiprocketFetch,
  type ShiprocketHttpResponse,
} from "./shiprocket";

export type ShiprocketAddress = {
  customerName: string;
  lastName?: string;
  address: string;
  address2?: string;
  city: string;
  pincode: string;
  state: string;
  country: string;
  email: string;
  phone: string;
  alternatePhone?: string;
};

export type ShiprocketOrderItem = {
  name: string;
  sku: string;
  units: number;
  sellingPriceRupees: number;
  discountRupees?: number;
  taxRupees?: number;
  hsn?: string;
};

export type ShiprocketCreateOrderInput = {
  orderId: string;
  orderDate: string;
  pickupLocation: string;
  companyName?: string;
  billing: ShiprocketAddress;
  shipping?: ShiprocketAddress;
  items: ShiprocketOrderItem[];
  paymentMethod: "Prepaid" | "COD";
  shippingChargesRupees?: number;
  totalDiscountRupees?: number;
  subTotalRupees: number;
  dimensionsCm: { length: number; breadth: number; height: number };
  weightKg: number;
};

export type ShiprocketCreateOrderResult = {
  orderId: number;
  shipmentId: number;
  status?: string;
  statusCode?: number;
};

type ExecutionClientOptions = ShiprocketClientOptions;

const BASE_URL = "https://apiv2.shiprocket.in";
const TOKEN_REFRESH_MS = 9 * 24 * 60 * 60 * 1000;

function defaultFetch(
  url: string,
  init: Parameters<ShiprocketFetch>[1]
): Promise<ShiprocketHttpResponse> {
  return fetch(url, init);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseJson(text: string, operation: string): unknown {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ShiprocketApiError(`Shiprocket returned a non-JSON response for ${operation}.`);
  }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function requiredString(value: string, field: string, maxLength = 256): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new ShiprocketApiError(`${field} must be between 1 and ${maxLength} characters.`);
  }
  return normalized;
}

function optionalString(value: string | undefined, maxLength = 256): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length > maxLength) {
    throw new ShiprocketApiError(`Optional text value exceeds ${maxLength} characters.`);
  }
  return normalized;
}

function validatePincode(pincode: string, field: string): string {
  const normalized = pincode.trim();
  if (!/^\d{6}$/.test(normalized)) {
    throw new ShiprocketApiError(`${field} must be a six-digit Indian PIN code.`);
  }
  return normalized;
}

function validatePhone(phone: string, field: string): string {
  const normalized = phone.replace(/\s+/g, "").trim();
  if (!/^\+?\d{7,15}$/.test(normalized)) {
    throw new ShiprocketApiError(`${field} must be a valid phone number.`);
  }
  return normalized;
}

function positiveNumber(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ShiprocketApiError(`${field} must be greater than zero.`);
  }
  return value;
}

function nonNegativeNumber(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new ShiprocketApiError(`${field} must be a non-negative number.`);
  }
  return value;
}

function positiveInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new ShiprocketApiError(`${field} must be a positive integer.`);
  }
  return value;
}

function validateOrderDate(value: string): string {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(normalized)) {
    throw new ShiprocketApiError(
      "orderDate must use YYYY-MM-DD or YYYY-MM-DD HH:mm[:ss] format."
    );
  }
  return normalized;
}

function serializeAddress(
  prefix: "billing" | "shipping",
  address: ShiprocketAddress
): Record<string, unknown> {
  return {
    [`${prefix}_customer_name`]: requiredString(address.customerName, `${prefix}.customerName`, 100),
    [`${prefix}_last_name`]: optionalString(address.lastName, 100) ?? "",
    [`${prefix}_address`]: requiredString(address.address, `${prefix}.address`, 256),
    [`${prefix}_address_2`]: optionalString(address.address2, 256) ?? "",
    [`${prefix}_city`]: requiredString(address.city, `${prefix}.city`, 30),
    [`${prefix}_pincode`]: validatePincode(address.pincode, `${prefix}.pincode`),
    [`${prefix}_state`]: requiredString(address.state, `${prefix}.state`, 100),
    [`${prefix}_country`]: requiredString(address.country, `${prefix}.country`, 100),
    [`${prefix}_email`]: requiredString(address.email, `${prefix}.email`, 254),
    [`${prefix}_phone`]: validatePhone(address.phone, `${prefix}.phone`),
    ...(address.alternatePhone
      ? { [`${prefix}_alternate_phone`]: validatePhone(address.alternatePhone, `${prefix}.alternatePhone`) }
      : {}),
  };
}

/**
 * Execution-capable Shiprocket client. Read-only serviceability/tracking and
 * courier lifecycle methods remain inherited from ShiprocketClient. The order
 * mutation keeps a separate short-lived auth cache so mainline tracking code
 * can evolve independently without exposing ShiprocketClient internals.
 */
export class ShiprocketExecutionClient extends ShiprocketClient {
  private readonly executionEmail: string;
  private readonly executionPassword: string;
  private readonly executionFetch: ShiprocketFetch;
  private readonly executionWriteEnabled: boolean;
  private readonly executionNow: () => number;
  private executionToken: string | null = null;
  private executionTokenRefreshAtMs = 0;

  constructor(options: ExecutionClientOptions) {
    super(options);
    this.executionEmail = options.email.trim();
    this.executionPassword = options.password.trim();
    this.executionFetch = options.fetchImpl ?? defaultFetch;
    this.executionWriteEnabled = options.writeEnabled === true;
    this.executionNow = options.now ?? Date.now;
  }

  private async executionAuthenticate(): Promise<string> {
    if (this.executionToken && this.executionNow() < this.executionTokenRefreshAtMs) {
      return this.executionToken;
    }

    const response = await this.executionFetch(`${BASE_URL}/v1/external/auth/login`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        email: this.executionEmail,
        password: this.executionPassword,
      }),
    });

    if (!response.ok) {
      throw new ShiprocketApiError(
        `Shiprocket authentication failed with HTTP ${response.status}.`,
        response.status
      );
    }

    const payload = asRecord(parseJson(await response.text(), "authentication"));
    const token = stringValue(payload?.token);
    if (!token) {
      throw new ShiprocketApiError("Shiprocket authentication response did not contain a token.");
    }

    this.executionToken = token;
    this.executionTokenRefreshAtMs = this.executionNow() + TOKEN_REFRESH_MS;
    return token;
  }

  async createCustomOrder(input: ShiprocketCreateOrderInput): Promise<ShiprocketCreateOrderResult> {
    if (!this.executionWriteEnabled) {
      throw new ShiprocketApiError(
        "Shiprocket order creation requires the explicit writeEnabled production gate."
      );
    }

    const orderId = requiredString(input.orderId, "orderId", 50);
    const pickupLocation = requiredString(input.pickupLocation, "pickupLocation", 100);
    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new ShiprocketApiError("Shiprocket order creation requires at least one item.");
    }

    const shippingIsBilling = !input.shipping;
    const payload: Record<string, unknown> = {
      order_id: orderId,
      order_date: validateOrderDate(input.orderDate),
      pickup_location: pickupLocation,
      company_name: optionalString(input.companyName, 100) ?? "",
      ...serializeAddress("billing", input.billing),
      shipping_is_billing: shippingIsBilling,
      ...(input.shipping ? serializeAddress("shipping", input.shipping) : {}),
      order_items: input.items.map((item) => ({
        name: requiredString(item.name, "item.name", 200),
        sku: requiredString(item.sku, "item.sku", 100),
        units: positiveInteger(item.units, "item.units"),
        selling_price: nonNegativeNumber(item.sellingPriceRupees, "item.sellingPriceRupees"),
        ...(item.discountRupees !== undefined
          ? { discount: nonNegativeNumber(item.discountRupees, "item.discountRupees") }
          : {}),
        ...(item.taxRupees !== undefined
          ? { tax: nonNegativeNumber(item.taxRupees, "item.taxRupees") }
          : {}),
        ...(item.hsn ? { hsn: requiredString(item.hsn, "item.hsn", 20) } : {}),
      })),
      payment_method: input.paymentMethod,
      shipping_charges: nonNegativeNumber(
        input.shippingChargesRupees ?? 0,
        "shippingChargesRupees"
      ),
      total_discount: nonNegativeNumber(
        input.totalDiscountRupees ?? 0,
        "totalDiscountRupees"
      ),
      sub_total: nonNegativeNumber(input.subTotalRupees, "subTotalRupees"),
      length: positiveNumber(input.dimensionsCm.length, "dimensionsCm.length"),
      breadth: positiveNumber(input.dimensionsCm.breadth, "dimensionsCm.breadth"),
      height: positiveNumber(input.dimensionsCm.height, "dimensionsCm.height"),
      weight: positiveNumber(input.weightKg, "weightKg"),
    };

    const token = await this.executionAuthenticate();
    const response = await this.executionFetch(`${BASE_URL}/v1/external/orders/create/adhoc`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Never replay a seller-account mutation automatically.
        this.executionToken = null;
        this.executionTokenRefreshAtMs = 0;
      }
      throw new ShiprocketApiError(
        `Shiprocket order creation failed with HTTP ${response.status}.`,
        response.status
      );
    }

    const result = asRecord(parseJson(await response.text(), "order creation"));
    const providerOrderId = numberValue(result?.order_id);
    const shipmentId = numberValue(result?.shipment_id);
    if (!providerOrderId || !shipmentId) {
      throw new ShiprocketApiError(
        "Shiprocket order creation response omitted order_id or shipment_id."
      );
    }

    return {
      orderId: providerOrderId,
      shipmentId,
      status: stringValue(result?.status),
      statusCode: numberValue(result?.status_code),
    };
  }
}

export function createShiprocketExecutionClientFromProviderConfig(
  config: Pick<
    LogisticsProviderConfig,
    "providerKey" | "credentialSource" | "credentialKey"
  >,
  options: Omit<ExecutionClientOptions, "email" | "password"> = {},
  env: Readonly<Record<string, string | undefined>> = process.env
): ShiprocketExecutionClient {
  if (config.providerKey !== "shiprocket") {
    throw new ShiprocketApiError("Shiprocket execution client requires providerKey=shiprocket.");
  }

  const resolution = resolveLogisticsCredentialBinding(config, env);
  if (!resolution.ok) {
    throw new ShiprocketApiError(
      `Shiprocket credential binding is unavailable: ${resolution.status}.`
    );
  }

  const email = resolution.bundle.values.email;
  const password = resolution.bundle.values.password;
  if (!email || !password) {
    throw new ShiprocketApiError("Shiprocket credential bundle is missing email/password.");
  }

  return new ShiprocketExecutionClient({ ...options, email, password });
}
