import type { LogisticsProviderConfig } from "@rinads/operations";
import { resolveLogisticsCredentialBinding } from "../logistics-secrets";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

export type ShiprocketHttpResponse = {
  ok: boolean;
  status: number;
  text(): Promise<string>;
};

export type ShiprocketFetch = (
  url: string,
  init: {
    method: "GET" | "POST";
    headers: Record<string, string>;
    body?: string;
  }
) => Promise<ShiprocketHttpResponse>;

export type ShiprocketClientOptions = {
  apiEmail?: string;
  apiPassword?: string;
  bearerToken?: string;
  /**
   * Explicit gate for provider mutations. Read-only serviceability/tracking are
   * available when credentials are configured; order/AWB/pickup/label calls are
   * blocked unless this is true.
   */
  externalEffectsEnabled?: boolean;
  fetchImpl?: ShiprocketFetch;
};

export type ShiprocketServiceabilityInput = {
  pickupPostcode: string;
  deliveryPostcode: string;
  cod: boolean;
  weightKg: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
  declaredValue?: number;
  mode?: "Surface" | "Air";
  isReturn?: boolean;
};

export type ShiprocketOrderItem = {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: string;
};

export type ShiprocketCreateOrderRequest = {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string | number;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string | number;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string | number;
  shipping_country?: string;
  shipping_state?: string;
  shipping_email?: string;
  shipping_phone?: string | number;
  order_items: ShiprocketOrderItem[];
  payment_method: "COD" | "Prepaid";
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
  [key: string]: unknown;
};

export class ShiprocketApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "ShiprocketApiError";
  }
}

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

function validatePincode(value: string | number, field: string): string {
  const normalized = String(value).trim();
  if (!/^\d{6}$/.test(normalized)) {
    throw new ShiprocketApiError(`${field} must be a six-digit Indian PIN code.`);
  }
  return normalized;
}

function validatePositive(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ShiprocketApiError(`${field} must be greater than zero.`);
  }
  return value;
}

function validateIdentifier(value: string | number, field: string, maxLength = 128): string {
  const normalized = String(value).trim();
  if (!normalized || normalized.length > maxLength) {
    throw new ShiprocketApiError(`${field} must be between 1 and ${maxLength} characters.`);
  }
  return normalized;
}

export class ShiprocketV1Client {
  private readonly apiEmail?: string;
  private readonly apiPassword?: string;
  private readonly fetchImpl: ShiprocketFetch;
  private readonly externalEffectsEnabled: boolean;
  private token?: string;

  constructor(options: ShiprocketClientOptions) {
    this.apiEmail = options.apiEmail?.trim() || undefined;
    this.apiPassword = options.apiPassword?.trim() || undefined;
    this.token = options.bearerToken?.trim() || undefined;
    this.externalEffectsEnabled = options.externalEffectsEnabled === true;
    this.fetchImpl = options.fetchImpl ?? defaultFetch;

    if (!this.token && (!this.apiEmail || !this.apiPassword)) {
      throw new ShiprocketApiError(
        "Shiprocket requires either a bearer token or API-user email and password."
      );
    }
  }

  private requireExternalEffects(operation: string): void {
    if (!this.externalEffectsEnabled) {
      throw new ShiprocketApiError(
        `Shiprocket ${operation} is blocked until externalEffectsEnabled=true after staging/canary approval.`
      );
    }
  }

  private async authenticate(): Promise<string> {
    if (this.token) return this.token;
    if (!this.apiEmail || !this.apiPassword) {
      throw new ShiprocketApiError("Shiprocket API-user credentials are unavailable.");
    }

    const response = await this.fetchImpl(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: this.apiEmail, password: this.apiPassword }),
    });

    if (!response.ok) {
      throw new ShiprocketApiError(
        `Shiprocket authentication failed with HTTP ${response.status}.`,
        response.status
      );
    }

    const payload = asRecord(parseJson(await response.text(), "authentication"));
    const token = typeof payload?.token === "string" ? payload.token.trim() : "";
    if (!token) {
      throw new ShiprocketApiError("Shiprocket authentication succeeded without a bearer token.");
    }
    this.token = token;
    return token;
  }

  private async request(
    operation: string,
    path: string,
    init: { method: "GET" | "POST"; body?: unknown },
    retryOnUnauthorized = true
  ): Promise<unknown> {
    const token = await this.authenticate();
    const response = await this.fetchImpl(`${SHIPROCKET_BASE_URL}${path}`, {
      method: init.method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });

    if (response.status === 401 && retryOnUnauthorized && this.apiEmail && this.apiPassword) {
      this.token = undefined;
      await this.authenticate();
      return this.request(operation, path, init, false);
    }

    if (!response.ok) {
      // Do not attach response bodies to errors; order/tracking responses may contain PII.
      throw new ShiprocketApiError(
        `Shiprocket ${operation} failed with HTTP ${response.status}.`,
        response.status
      );
    }

    return parseJson(await response.text(), operation);
  }

  async checkServiceability(input: ShiprocketServiceabilityInput): Promise<unknown> {
    const params = new URLSearchParams({
      pickup_postcode: validatePincode(input.pickupPostcode, "pickupPostcode"),
      delivery_postcode: validatePincode(input.deliveryPostcode, "deliveryPostcode"),
      cod: input.cod ? "1" : "0",
      weight: String(validatePositive(input.weightKg, "weightKg")),
      is_return: input.isReturn ? "1" : "0",
    });
    if (input.lengthCm !== undefined) params.set("length", String(validatePositive(input.lengthCm, "lengthCm")));
    if (input.breadthCm !== undefined) params.set("breadth", String(validatePositive(input.breadthCm, "breadthCm")));
    if (input.heightCm !== undefined) params.set("height", String(validatePositive(input.heightCm, "heightCm")));
    if (input.declaredValue !== undefined) params.set("declared_value", String(validatePositive(input.declaredValue, "declaredValue")));
    if (input.mode) params.set("mode", input.mode);

    return this.request("courier serviceability", `/courier/serviceability/?${params.toString()}`, {
      method: "GET",
    });
  }

  async trackByAwb(awb: string): Promise<unknown> {
    const normalized = validateIdentifier(awb, "awb", 128);
    return this.request("AWB tracking", `/courier/track/awb/${encodeURIComponent(normalized)}`, {
      method: "GET",
    });
  }

  async trackByShipmentId(shipmentId: string | number): Promise<unknown> {
    const normalized = validateIdentifier(shipmentId, "shipmentId", 64);
    return this.request(
      "shipment tracking",
      `/courier/track/shipment/${encodeURIComponent(normalized)}`,
      { method: "GET" }
    );
  }

  async getShipment(shipmentId: string | number): Promise<unknown> {
    const normalized = validateIdentifier(shipmentId, "shipmentId", 64);
    return this.request("shipment details", `/shipments/${encodeURIComponent(normalized)}`, {
      method: "GET",
    });
  }

  async createCustomOrder(order: ShiprocketCreateOrderRequest): Promise<unknown> {
    this.requireExternalEffects("order creation");
    validateIdentifier(order.order_id, "order_id", 128);
    validateIdentifier(order.pickup_location, "pickup_location", 256);
    validatePincode(order.billing_pincode, "billing_pincode");
    validatePositive(order.sub_total, "sub_total");
    validatePositive(order.length, "length");
    validatePositive(order.breadth, "breadth");
    validatePositive(order.height, "height");
    validatePositive(order.weight, "weight");
    if (!Array.isArray(order.order_items) || order.order_items.length === 0) {
      throw new ShiprocketApiError("order_items must contain at least one item.");
    }
    if (!order.shipping_is_billing) {
      validatePincode(order.shipping_pincode ?? "", "shipping_pincode");
    }

    return this.request("order creation", "/orders/create/adhoc", {
      method: "POST",
      body: order,
    });
  }

  async assignAwb(shipmentId: string | number, courierId?: string | number): Promise<unknown> {
    this.requireExternalEffects("AWB assignment");
    const payload: Record<string, string> = {
      shipment_id: validateIdentifier(shipmentId, "shipmentId", 64),
    };
    if (courierId !== undefined) payload.courier_id = validateIdentifier(courierId, "courierId", 64);

    return this.request("AWB assignment", "/courier/assign/awb", {
      method: "POST",
      body: payload,
    });
  }

  async requestPickup(shipmentId: string | number, pickupDate?: string): Promise<unknown> {
    this.requireExternalEffects("pickup request");
    const payload: Record<string, unknown> = {
      shipment_id: [Number(validateIdentifier(shipmentId, "shipmentId", 64))],
    };
    if (pickupDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
        throw new ShiprocketApiError("pickupDate must use YYYY-MM-DD format.");
      }
      payload.pickup_date = [pickupDate];
    }

    return this.request("pickup request", "/courier/generate/pickup", {
      method: "POST",
      body: payload,
    });
  }

  async generateLabel(shipmentIds: Array<string | number>): Promise<unknown> {
    this.requireExternalEffects("label generation");
    if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      throw new ShiprocketApiError("At least one shipment id is required for label generation.");
    }
    const normalized = shipmentIds.map((id) => validateIdentifier(id, "shipmentId", 64));

    return this.request("label generation", "/courier/generate/label", {
      method: "POST",
      body: { shipment_id: normalized },
    });
  }
}

export function createShiprocketV1ClientFromProviderConfig(
  config: Pick<LogisticsProviderConfig, "providerKey" | "credentialSource" | "credentialKey">,
  options: Omit<ShiprocketClientOptions, "apiEmail" | "apiPassword"> = {},
  env: Readonly<Record<string, string | undefined>> = process.env
): ShiprocketV1Client {
  if (config.providerKey !== "shiprocket") {
    throw new ShiprocketApiError("Shiprocket client requires providerKey=shiprocket.");
  }

  const resolution = resolveLogisticsCredentialBinding(config, env);
  if (!resolution.ok) {
    throw new ShiprocketApiError(
      `Shiprocket credential binding is unavailable: ${resolution.status}.`
    );
  }

  const apiEmail = resolution.bundle.values.apiEmail;
  const apiPassword = resolution.bundle.values.apiPassword;
  if (!apiEmail || !apiPassword) {
    throw new ShiprocketApiError("Shiprocket credential bundle is missing API-user credentials.");
  }

  return new ShiprocketV1Client({ ...options, apiEmail, apiPassword });
}
