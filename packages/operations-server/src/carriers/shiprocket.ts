import type { LogisticsProviderConfig } from "@rinads/operations";
import { resolveLogisticsCredentialBinding } from "../logistics-secrets";

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
  email: string;
  password: string;
  /**
   * Shiprocket's public seller APIs operate on the live account. Mutation calls
   * therefore require a second explicit server-side gate in addition to credentials.
   */
  writeEnabled?: boolean;
  fetchImpl?: ShiprocketFetch;
  now?: () => number;
};

export type ShiprocketServiceabilityInput = {
  pickupPincode: string;
  deliveryPincode: string;
  weightKg: number;
  cod: boolean;
  dimensionsCm?: {
    length: number;
    breadth: number;
    height: number;
  };
  declaredValueRupees?: number;
  mode?: "Surface" | "Air";
  isReturn?: boolean;
};

export type ShiprocketCourierOption = {
  courierCompanyId: number;
  courierName: string;
  rateRupees?: number;
  freightChargeRupees?: number;
  cod: boolean;
  estimatedDeliveryDays?: string;
  etdHours?: number;
  rating?: number;
  deliveryPerformance?: number;
  pickupPerformance?: number;
  rtoPerformance?: number;
  realtimeTracking?: string;
  isSurface?: boolean;
};

export type ShiprocketServiceabilityResult = {
  currency: string;
  couriers: ShiprocketCourierOption[];
};

export type ShiprocketAwbAssignment = {
  assigned: boolean;
  shipmentId?: number;
  orderId?: number;
  awb?: string;
  courierCompanyId?: number;
  courierName?: string;
};

export type ShiprocketPickupResult = {
  scheduled: boolean;
  scheduledDate?: string;
  tokenNumber?: string;
};

export type ShiprocketLabelResult = {
  created: boolean;
  labelUrl?: string;
};

export type ShiprocketTrackingEvent = {
  occurredAt?: string;
  status?: string;
  activity?: string;
  location?: string;
  shiprocketStatusCode?: string;
  shiprocketStatusLabel?: string;
};

export type ShiprocketTrackingResult = {
  trackingAvailable: boolean;
  awb?: string;
  shipmentId?: number;
  orderId?: number;
  courierName?: string;
  currentStatus?: string;
  currentStatusId?: number;
  shipmentStatusId?: number;
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
  trackingUrl?: string;
  events: ShiprocketTrackingEvent[];
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

function scalarString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function booleanFlag(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "Y" || value === "yes";
}

function validatePincode(pincode: string, field: string): string {
  const normalized = pincode.trim();
  if (!/^\d{6}$/.test(normalized)) {
    throw new ShiprocketApiError(`${field} must be a six-digit Indian PIN code.`);
  }
  return normalized;
}

function positiveNumber(value: number, field: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new ShiprocketApiError(`${field} must be greater than zero.`);
  }
  return value;
}

function positiveInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new ShiprocketApiError(`${field} must be a positive integer.`);
  }
  return value;
}

function validateAwb(awb: string): string {
  const normalized = awb.trim();
  if (!normalized || normalized.length > 128 || !/^[A-Za-z0-9._/-]+$/.test(normalized)) {
    throw new ShiprocketApiError("awb must be a valid carrier tracking identifier.");
  }
  return normalized;
}

function firstRecord(value: unknown): Record<string, unknown> | null {
  if (!Array.isArray(value)) return null;
  for (const entry of value) {
    const record = asRecord(entry);
    if (record) return record;
  }
  return null;
}

function trackingEvents(value: unknown): ShiprocketTrackingEvent[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): ShiprocketTrackingEvent[] => {
    const event = asRecord(entry);
    if (!event) return [];
    const normalized: ShiprocketTrackingEvent = {
      occurredAt: stringValue(event.date) ?? stringValue(event.current_timestamp),
      status: scalarString(event.status),
      activity: stringValue(event.activity),
      location: stringValue(event.location),
      shiprocketStatusCode: scalarString(event["sr-status"] ?? event.sr_status),
      shiprocketStatusLabel: stringValue(event["sr-status-label"] ?? event.sr_status_label),
    };
    if (!Object.values(normalized).some(Boolean)) return [];
    return [normalized];
  });
}

/**
 * Normalize the non-sensitive tracking evidence RINADS needs from either a
 * Shiprocket tracking response or Shiprocket's documented tracking-webhook
 * shape. Customer names, addresses, phones and other provider payload fields
 * are deliberately not projected into this result.
 */
export function normalizeShiprocketTrackingPayload(payload: unknown): ShiprocketTrackingResult {
  const root = asRecord(payload) ?? {};
  const trackingData = asRecord(root.tracking_data) ?? root;
  const shipmentTrack = firstRecord(trackingData.shipment_track);
  const events = trackingEvents(
    trackingData.shipment_track_activities ?? trackingData.scans ?? root.scans
  );

  const awb =
    scalarString(trackingData.awb) ??
    scalarString(trackingData.awb_code) ??
    scalarString(shipmentTrack?.awb_code) ??
    scalarString(root.awb);
  const shipmentId =
    numberValue(trackingData.shipment_id) ??
    numberValue(shipmentTrack?.shipment_id) ??
    numberValue(root.shipment_id);
  const orderId =
    numberValue(trackingData.order_id) ??
    numberValue(shipmentTrack?.order_id) ??
    numberValue(root.sr_order_id);
  const currentStatus =
    stringValue(trackingData.current_status) ??
    stringValue(shipmentTrack?.current_status) ??
    stringValue(root.current_status) ??
    stringValue(root.shipment_status);
  const currentStatusId =
    numberValue(trackingData.current_status_id) ??
    numberValue(root.current_status_id);
  const shipmentStatusId =
    numberValue(trackingData.shipment_status_id) ??
    numberValue(trackingData.shipment_status) ??
    numberValue(root.shipment_status_id);
  const courierName =
    stringValue(trackingData.courier_name) ??
    stringValue(shipmentTrack?.courier_name) ??
    stringValue(root.courier_name);
  const estimatedDeliveryAt =
    stringValue(trackingData.etd) ??
    stringValue(shipmentTrack?.etd) ??
    stringValue(root.etd);
  const deliveredAt =
    stringValue(trackingData.delivered_date) ??
    stringValue(shipmentTrack?.delivered_date) ??
    stringValue(root.delivered_date);
  const trackingUrl =
    stringValue(trackingData.track_url) ??
    stringValue(root.track_url);

  return {
    trackingAvailable: Boolean(
      awb ||
        shipmentId ||
        currentStatus ||
        currentStatusId ||
        shipmentStatusId ||
        courierName ||
        events.length > 0
    ),
    awb,
    shipmentId,
    orderId,
    courierName,
    currentStatus,
    currentStatusId,
    shipmentStatusId,
    estimatedDeliveryAt,
    deliveredAt,
    trackingUrl,
    events,
  };
}

export class ShiprocketClient {
  private readonly email: string;
  private readonly password: string;
  private readonly fetchImpl: ShiprocketFetch;
  private readonly writeEnabled: boolean;
  private readonly now: () => number;
  private token: string | null = null;
  private tokenRefreshAtMs = 0;

  constructor(options: ShiprocketClientOptions) {
    this.email = options.email.trim();
    this.password = options.password.trim();
    if (!this.email) throw new ShiprocketApiError("Shiprocket API user email is required.");
    if (!this.password) throw new ShiprocketApiError("Shiprocket API user password is required.");

    this.fetchImpl = options.fetchImpl ?? defaultFetch;
    this.writeEnabled = options.writeEnabled === true;
    this.now = options.now ?? Date.now;
  }

  private async authenticate(): Promise<string> {
    if (this.token && this.now() < this.tokenRefreshAtMs) return this.token;

    const response = await this.fetchImpl(`${BASE_URL}/v1/external/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: this.email, password: this.password }),
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

    this.token = token;
    // Official documentation currently states a 10-day token validity. Refresh
    // one day early rather than relying on the full vendor lifetime.
    this.tokenRefreshAtMs = this.now() + TOKEN_REFRESH_MS;
    return token;
  }

  private requireWriteEnabled(operation: string): void {
    if (!this.writeEnabled) {
      throw new ShiprocketApiError(
        `Shiprocket ${operation} requires the explicit writeEnabled production gate.`
      );
    }
  }

  private async request(
    operation: string,
    path: string,
    init: { method: "GET" | "POST"; body?: unknown }
  ): Promise<unknown> {
    const token = await this.authenticate();
    const response = await this.fetchImpl(`${BASE_URL}${path}`, {
      method: init.method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Never automatically replay a carrier mutation. Clear the cached token
        // so the next explicit call re-authenticates instead.
        this.token = null;
        this.tokenRefreshAtMs = 0;
      }
      // Do not surface carrier response bodies because they can contain PII.
      throw new ShiprocketApiError(
        `Shiprocket ${operation} failed with HTTP ${response.status}.`,
        response.status
      );
    }

    return parseJson(await response.text(), operation);
  }

  async checkServiceability(
    input: ShiprocketServiceabilityInput
  ): Promise<ShiprocketServiceabilityResult> {
    const pickup = validatePincode(input.pickupPincode, "pickupPincode");
    const delivery = validatePincode(input.deliveryPincode, "deliveryPincode");
    const weightKg = positiveNumber(input.weightKg, "weightKg");

    const params = new URLSearchParams({
      pickup_postcode: pickup,
      delivery_postcode: delivery,
      cod: input.cod ? "1" : "0",
      weight: String(weightKg),
      is_return: input.isReturn ? "1" : "0",
    });

    if (input.mode) params.set("mode", input.mode);
    if (input.declaredValueRupees !== undefined) {
      if (!Number.isFinite(input.declaredValueRupees) || input.declaredValueRupees < 0) {
        throw new ShiprocketApiError("declaredValueRupees must be a non-negative number.");
      }
      params.set("declared_value", String(input.declaredValueRupees));
    }
    if (input.dimensionsCm) {
      params.set("length", String(positiveNumber(input.dimensionsCm.length, "dimensionsCm.length")));
      params.set("breadth", String(positiveNumber(input.dimensionsCm.breadth, "dimensionsCm.breadth")));
      params.set("height", String(positiveNumber(input.dimensionsCm.height, "dimensionsCm.height")));
    }

    const payload = asRecord(
      await this.request(
        "courier serviceability",
        `/v1/external/courier/serviceability/?${params.toString()}`,
        { method: "GET" }
      )
    );
    const data = asRecord(payload?.data);
    const rawCouriers = Array.isArray(data?.available_courier_companies)
      ? data.available_courier_companies
      : [];

    const couriers = rawCouriers.flatMap((entry): ShiprocketCourierOption[] => {
      const courier = asRecord(entry);
      const courierCompanyId = numberValue(courier?.courier_company_id);
      const courierName = stringValue(courier?.courier_name);
      if (!courierCompanyId || !courierName) return [];

      const rawRate = courier?.rate;
      const scalarRate = numberValue(rawRate);
      return [
        {
          courierCompanyId,
          courierName,
          rateRupees: scalarRate ?? numberValue(courier?.freight_charge),
          freightChargeRupees: numberValue(courier?.freight_charge),
          cod: booleanFlag(courier?.cod),
          estimatedDeliveryDays: stringValue(courier?.estimated_delivery_days),
          etdHours: numberValue(courier?.etd_hours),
          rating: numberValue(courier?.rating),
          deliveryPerformance: numberValue(courier?.delivery_performance),
          pickupPerformance: numberValue(courier?.pickup_performance),
          rtoPerformance: numberValue(courier?.rto_performance),
          realtimeTracking: stringValue(courier?.realtime_tracking),
          isSurface:
            typeof courier?.is_surface === "boolean"
              ? courier.is_surface
              : booleanFlag(courier?.is_surface),
        },
      ];
    });

    return {
      currency: stringValue(payload?.currency) ?? "INR",
      couriers,
    };
  }

  async trackByAwb(awb: string): Promise<ShiprocketTrackingResult> {
    const normalizedAwb = validateAwb(awb);
    const payload = await this.request(
      "AWB tracking",
      `/v1/external/courier/track/awb/${encodeURIComponent(normalizedAwb)}`,
      { method: "GET" }
    );
    const normalized = normalizeShiprocketTrackingPayload(payload);
    return normalized.awb ? normalized : { ...normalized, awb: normalizedAwb };
  }

  async trackByShipmentId(shipmentId: number): Promise<ShiprocketTrackingResult> {
    const id = positiveInteger(shipmentId, "shipmentId");
    const payload = await this.request(
      "shipment tracking",
      `/v1/external/courier/track/shipment/${id}`,
      { method: "GET" }
    );
    const normalized = normalizeShiprocketTrackingPayload(payload);
    return normalized.shipmentId ? normalized : { ...normalized, shipmentId: id };
  }

  async assignAwb(shipmentId: number, courierId?: number): Promise<ShiprocketAwbAssignment> {
    this.requireWriteEnabled("AWB assignment");
    const body: Record<string, number> = {
      shipment_id: positiveInteger(shipmentId, "shipmentId"),
    };
    if (courierId !== undefined) body.courier_id = positiveInteger(courierId, "courierId");

    const payload = asRecord(
      await this.request("AWB assignment", "/v1/external/courier/assign/awb", {
        method: "POST",
        body,
      })
    );
    const response = asRecord(payload?.response);
    const data = asRecord(response?.data);

    return {
      assigned: booleanFlag(payload?.awb_assign_status),
      shipmentId: numberValue(data?.shipment_id),
      orderId: numberValue(data?.order_id),
      awb: stringValue(data?.awb_code),
      courierCompanyId: numberValue(data?.courier_company_id),
      courierName: stringValue(data?.courier_name),
    };
  }

  async requestPickup(shipmentId: number, pickupDate?: string): Promise<ShiprocketPickupResult> {
    this.requireWriteEnabled("pickup scheduling");
    if (pickupDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
      throw new ShiprocketApiError("pickupDate must use YYYY-MM-DD format.");
    }

    const body: Record<string, unknown> = {
      shipment_id: [positiveInteger(shipmentId, "shipmentId")],
    };
    if (pickupDate) body.pickup_date = [pickupDate];

    const payload = asRecord(
      await this.request("pickup scheduling", "/v1/external/courier/generate/pickup", {
        method: "POST",
        body,
      })
    );
    const response = asRecord(payload?.response);

    return {
      scheduled: booleanFlag(payload?.pickup_status),
      scheduledDate: stringValue(response?.pickup_scheduled_date),
      tokenNumber:
        stringValue(response?.pickup_token_number) ??
        (response?.pickup_token_number === undefined
          ? undefined
          : String(response.pickup_token_number)),
    };
  }

  async generateLabel(shipmentIds: number[]): Promise<ShiprocketLabelResult> {
    this.requireWriteEnabled("label generation");
    if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      throw new ShiprocketApiError("At least one shipmentId is required for label generation.");
    }
    const ids = shipmentIds.map((id) => positiveInteger(id, "shipmentId"));

    const payload = asRecord(
      await this.request("label generation", "/v1/external/courier/generate/label", {
        method: "POST",
        body: { shipment_id: ids },
      })
    );

    return {
      created: booleanFlag(payload?.label_created),
      labelUrl: stringValue(payload?.label_url),
    };
  }

  async cancelShipment(awbs: string[]): Promise<{ accepted: true }> {
    this.requireWriteEnabled("shipment cancellation");
    if (!Array.isArray(awbs) || awbs.length === 0) {
      throw new ShiprocketApiError("At least one AWB is required for shipment cancellation.");
    }
    const normalized = awbs.map((awb) => {
      const value = awb.trim();
      if (!value || value.length > 100) {
        throw new ShiprocketApiError("Each AWB must be between 1 and 100 characters.");
      }
      return value;
    });

    await this.request("shipment cancellation", "/v1/external/orders/cancel/shipment/awbs", {
      method: "POST",
      body: { awbs: normalized },
    });
    return { accepted: true };
  }

  async getShipment(shipmentId: number): Promise<unknown> {
    return this.request(
      "shipment details",
      `/v1/external/shipments/${positiveInteger(shipmentId, "shipmentId")}`,
      { method: "GET" }
    );
  }
}

export function createShiprocketClientFromProviderConfig(
  config: Pick<
    LogisticsProviderConfig,
    "providerKey" | "credentialSource" | "credentialKey"
  >,
  options: Omit<ShiprocketClientOptions, "email" | "password"> = {},
  env: Readonly<Record<string, string | undefined>> = process.env
): ShiprocketClient {
  if (config.providerKey !== "shiprocket") {
    throw new ShiprocketApiError("Shiprocket client requires providerKey=shiprocket.");
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

  return new ShiprocketClient({ ...options, email, password });
}
