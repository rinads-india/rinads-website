import type { LogisticsProviderConfig } from "@rinads/operations";
import { resolveLogisticsCredentialBinding } from "../logistics-secrets";

export type DelhiveryEnvironment = "staging" | "production";

export type DelhiveryHttpResponse = {
  ok: boolean;
  status: number;
  text(): Promise<string>;
};

export type DelhiveryFetch = (
  url: string,
  init: {
    method: "GET" | "POST";
    headers: Record<string, string>;
    body?: string;
  }
) => Promise<DelhiveryHttpResponse>;

export type DelhiveryClientOptions = {
  token: string;
  environment?: DelhiveryEnvironment;
  /** Explicit second gate required before any production request is allowed. */
  productionEnabled?: boolean;
  fetchImpl?: DelhiveryFetch;
};

export type DelhiveryServiceability = {
  pincode: string;
  serviceable: boolean;
  prepaid: boolean;
  cod: boolean;
  reversePickup: boolean;
  pickup: boolean;
  remarks?: string;
};

export type DelhiveryShippingCostInput = {
  originPincode: string;
  destinationPincode: string;
  chargeableWeightGrams: number;
  paymentMode: "Pre-paid" | "COD";
  shippingMode?: "S" | "E";
  shipmentStatus?: "Delivered" | "RTO" | "DTO";
};

export type DelhiveryTrackingInput = {
  waybill: string;
  orderId?: string;
};

export type DelhiveryPickupRequest = {
  pickupTime: string;
  pickupDate: string;
  pickupLocation: string;
  expectedPackageCount: number;
};

export type DelhiveryManifestShipment = Record<string, unknown> & {
  pin: string | number;
  phone: string | number;
  add: string;
  order: string;
  payment_mode: "Pre-paid" | "COD" | "Pickup";
};

export type DelhiveryManifestRequest = {
  shipments: DelhiveryManifestShipment[];
  pickup_location: { name: string };
  fragile_shipment?: boolean;
};

export class DelhiveryApiError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "DelhiveryApiError";
  }
}

const BASE_URLS: Record<DelhiveryEnvironment, string> = {
  staging: "https://staging-express.delhivery.com",
  production: "https://track.delhivery.com",
};

function defaultFetch(
  url: string,
  init: Parameters<DelhiveryFetch>[1]
): Promise<DelhiveryHttpResponse> {
  return fetch(url, init);
}

function validatePincode(pincode: string, field: string): string {
  const normalized = pincode.trim();
  if (!/^\d{6}$/.test(normalized)) {
    throw new DelhiveryApiError(`${field} must be a six-digit Indian PIN code.`);
  }
  return normalized;
}

function validateIdentifier(value: string, field: string, maxLength = 100): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new DelhiveryApiError(`${field} must be between 1 and ${maxLength} characters.`);
  }
  return normalized;
}

function parseJson(text: string, operation: string): unknown {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new DelhiveryApiError(`Delhivery returned a non-JSON response for ${operation}.`);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function flag(value: unknown): boolean {
  return value === "Y" || value === true || value === 1;
}

export class DelhiveryB2cClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: DelhiveryFetch;
  private readonly token: string;
  readonly environment: DelhiveryEnvironment;

  constructor(options: DelhiveryClientOptions) {
    const token = options.token.trim();
    if (!token) throw new DelhiveryApiError("Delhivery API token is required.");

    this.environment = options.environment ?? "staging";
    if (this.environment === "production" && options.productionEnabled !== true) {
      throw new DelhiveryApiError(
        "Delhivery production access requires the explicit productionEnabled gate."
      );
    }

    this.token = token;
    this.baseUrl = BASE_URLS[this.environment];
    this.fetchImpl = options.fetchImpl ?? defaultFetch;
  }

  private headers(contentType = "application/json"): Record<string, string> {
    return {
      Authorization: `Token ${this.token}`,
      Accept: "application/json",
      "Content-Type": contentType,
    };
  }

  private async jsonRequest(
    operation: string,
    path: string,
    init: {
      method: "GET" | "POST";
      body?: string;
      contentType?: string;
    }
  ): Promise<unknown> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: init.method,
      headers: this.headers(init.contentType),
      body: init.body,
    });

    if (!response.ok) {
      // Deliberately do not include carrier response bodies: they can contain PII.
      throw new DelhiveryApiError(
        `Delhivery ${operation} failed with HTTP ${response.status}.`,
        response.status
      );
    }

    return parseJson(await response.text(), operation);
  }

  async checkPincode(pincode: string): Promise<DelhiveryServiceability> {
    const pin = validatePincode(pincode, "pincode");
    const payload = await this.jsonRequest(
      "pincode serviceability",
      `/c/api/pin-codes/json/?filter_codes=${encodeURIComponent(pin)}`,
      { method: "GET" }
    );

    const root = asRecord(payload);
    const deliveryCodes = root?.delivery_codes;
    const codes = Array.isArray(deliveryCodes) ? deliveryCodes : [];
    const first = asRecord(codes[0]);
    const postal = asRecord(first?.postal_code);
    if (!postal) {
      return {
        pincode: pin,
        serviceable: false,
        prepaid: false,
        cod: false,
        reversePickup: false,
        pickup: false,
      };
    }

    const remarks = typeof postal.remarks === "string" ? postal.remarks.trim() : undefined;
    const prepaid = flag(postal.pre_paid);
    const cod = flag(postal.cod) || flag(postal.cash);
    const reversePickup = flag(postal.repl);
    const pickup = flag(postal.pickup);
    const embargoed = remarks?.toLowerCase() === "embargo";

    return {
      pincode: pin,
      serviceable: !embargoed && (prepaid || cod || reversePickup || pickup),
      prepaid,
      cod,
      reversePickup,
      pickup,
      remarks: remarks || undefined,
    };
  }

  async calculateShippingCost(input: DelhiveryShippingCostInput): Promise<unknown> {
    const origin = validatePincode(input.originPincode, "originPincode");
    const destination = validatePincode(input.destinationPincode, "destinationPincode");
    if (!Number.isFinite(input.chargeableWeightGrams) || input.chargeableWeightGrams <= 0) {
      throw new DelhiveryApiError("chargeableWeightGrams must be greater than zero.");
    }

    const params = new URLSearchParams({
      md: input.shippingMode ?? "S",
      ss: input.shipmentStatus ?? "Delivered",
      d_pin: destination,
      o_pin: origin,
      cgm: String(Math.ceil(input.chargeableWeightGrams)),
      pt: input.paymentMode,
    });

    return this.jsonRequest(
      "shipping cost",
      `/api/kinko/v1/invoice/charges/.json?${params.toString()}`,
      { method: "GET" }
    );
  }

  async track(input: DelhiveryTrackingInput): Promise<unknown> {
    const waybill = validateIdentifier(input.waybill, "waybill", 100);
    const params = new URLSearchParams({ waybill });
    if (input.orderId?.trim()) params.set("ref_ids", input.orderId.trim());

    return this.jsonRequest("shipment tracking", `/api/v1/packages/json/?${params}`, {
      method: "GET",
    });
  }

  async getPackingSlip(waybill: string, pdf = false): Promise<unknown> {
    const normalized = validateIdentifier(waybill, "waybill", 100);
    const params = new URLSearchParams({ wbns: normalized });
    if (pdf) params.set("pdf", "True");

    return this.jsonRequest("packing slip", `/api/p/packing_slip?${params}`, {
      method: "GET",
    });
  }

  async cancel(waybill: string): Promise<unknown> {
    const normalized = validateIdentifier(waybill, "waybill", 100);
    return this.jsonRequest("shipment cancellation", "/api/p/edit", {
      method: "POST",
      body: JSON.stringify({ waybill: normalized, cancellation: "true" }),
    });
  }

  async requestPickup(request: DelhiveryPickupRequest): Promise<unknown> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(request.pickupDate)) {
      throw new DelhiveryApiError("pickupDate must use YYYY-MM-DD format.");
    }
    if (!/^\d{2}:\d{2}:\d{2}$/.test(request.pickupTime)) {
      throw new DelhiveryApiError("pickupTime must use HH:mm:ss format.");
    }
    const pickupLocation = validateIdentifier(request.pickupLocation, "pickupLocation", 256);
    if (!Number.isSafeInteger(request.expectedPackageCount) || request.expectedPackageCount <= 0) {
      throw new DelhiveryApiError("expectedPackageCount must be a positive integer.");
    }

    return this.jsonRequest("pickup request", "/fm/request/new/", {
      method: "POST",
      body: JSON.stringify({
        pickup_time: request.pickupTime,
        pickup_date: request.pickupDate,
        pickup_location: pickupLocation,
        expected_package_count: request.expectedPackageCount,
      }),
    });
  }

  async manifest(request: DelhiveryManifestRequest): Promise<unknown> {
    if (!Array.isArray(request.shipments) || request.shipments.length === 0) {
      throw new DelhiveryApiError("At least one shipment is required for manifestation.");
    }
    validateIdentifier(request.pickup_location?.name ?? "", "pickup_location.name", 256);

    for (const shipment of request.shipments) {
      validatePincode(String(shipment.pin), "shipment.pin");
      validateIdentifier(String(shipment.phone), "shipment.phone", 32);
      validateIdentifier(shipment.add, "shipment.add", 256);
      validateIdentifier(shipment.order, "shipment.order", 50);
    }

    const data = JSON.stringify(request);
    const body = new URLSearchParams({ format: "json", data }).toString();

    return this.jsonRequest("shipment manifestation", "/api/cmu/create.json", {
      method: "POST",
      body,
      contentType: "application/x-www-form-urlencoded",
    });
  }
}

export function createDelhiveryB2cClientFromProviderConfig(
  config: Pick<
    LogisticsProviderConfig,
    "providerKey" | "credentialSource" | "credentialKey"
  >,
  options: Omit<DelhiveryClientOptions, "token"> = {},
  env: Readonly<Record<string, string | undefined>> = process.env
): DelhiveryB2cClient {
  if (config.providerKey !== "delhivery") {
    throw new DelhiveryApiError("Delhivery client requires providerKey=delhivery.");
  }

  const resolution = resolveLogisticsCredentialBinding(config, env);
  if (!resolution.ok) {
    throw new DelhiveryApiError(
      `Delhivery credential binding is unavailable: ${resolution.status}.`
    );
  }

  const apiToken = resolution.bundle.values.apiToken;
  if (!apiToken) {
    throw new DelhiveryApiError("Delhivery credential bundle is missing apiToken.");
  }

  return new DelhiveryB2cClient({ ...options, token: apiToken });
}