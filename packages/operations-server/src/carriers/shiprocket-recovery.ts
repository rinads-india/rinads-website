import { createHash } from "node:crypto";
import type { LogisticsProviderConfig } from "@rinads/operations";
import { resolveLogisticsCredentialBinding } from "../logistics-secrets";
import { ShiprocketApiError, type ShiprocketFetch } from "./shiprocket";

const BASE_URL = "https://apiv2.shiprocket.in";
const TOKEN_REFRESH_MS = 9 * 24 * 60 * 60 * 1000;

export type ShiprocketRecoveredOrder = {
  providerReference: string;
  providerOrderId: number;
  providerShipmentId?: number;
  awb?: string;
  courierName?: string;
  status?: string;
  statusCode?: number;
  cancelled: boolean;
  pickupAlreadyProgressed: boolean;
};

export type ShiprocketRecoveryRecord = {
  organizationId: string;
  orderId: string;
  packageId: string;
  providerReference: string;
  providerOrderId?: string;
  providerShipmentId?: string;
  awb?: string;
  service?: string;
  trackingUrl?: string;
  providerStatus?: string;
  providerStatusCode?: number;
  recovered: boolean;
};

export interface ShiprocketRecoveryStore {
  find(providerReference: string): Promise<ShiprocketRecoveryRecord | null>;
  save(record: ShiprocketRecoveryRecord): Promise<void>;
}

export type ShiprocketOrderRecoveryClientOptions = {
  email: string;
  password: string;
  fetchImpl?: ShiprocketFetch;
  now?: () => number;
};

function defaultFetch(
  url: string,
  init: Parameters<ShiprocketFetch>[1]
): ReturnType<ShiprocketFetch> {
  return fetch(url, init);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numeric(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function parseJson(value: string, operation: string): unknown {
  if (!value.trim()) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new ShiprocketApiError(
      `Shiprocket returned a non-JSON response for ${operation}.`
    );
  }
}

function orderRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload
      .map(asRecord)
      .filter((row): row is Record<string, unknown> => Boolean(row));
  }
  const root = asRecord(payload);
  const data = root?.data;
  if (Array.isArray(data)) {
    return data
      .map(asRecord)
      .filter((row): row is Record<string, unknown> => Boolean(row));
  }
  const nested = asRecord(data);
  const rows = nested?.data;
  if (Array.isArray(rows)) {
    return rows
      .map(asRecord)
      .filter((row): row is Record<string, unknown> => Boolean(row));
  }
  return [];
}

function pickupProgressed(statusCode: number | undefined): boolean {
  if (statusCode === undefined) return false;
  return new Set([
    4, 6, 7, 9, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    26, 66, 67, 68, 70, 71, 72, 73, 74, 75, 76, 80, 81, 82, 83, 87,
    88, 89, 90,
  ]).has(statusCode);
}

function mapOrder(row: Record<string, unknown>): ShiprocketRecoveredOrder | null {
  const providerReference = text(row.channel_order_id);
  const providerOrderId = numeric(row.id ?? row.order_id);
  if (!providerReference || !providerOrderId) return null;

  const shipments = Array.isArray(row.shipments) ? row.shipments : [];
  const shipment = asRecord(shipments[0]);
  const providerShipmentId = numeric(
    shipment?.id ?? shipment?.shipment_id ?? row.shipment_id
  );
  const awb = text(
    shipment?.awb ?? shipment?.awb_code ?? row.awb ?? row.awb_code
  );
  const courierName = text(
    shipment?.courier_name ?? shipment?.courier ?? row.courier_name
  );
  const status = text(row.status ?? row.status_name);
  const statusCode = numeric(row.status_code ?? row.status_id ?? row.status);
  const normalizedStatus = status?.toLowerCase();
  const cancelled =
    statusCode === 5 ||
    normalizedStatus === "canceled" ||
    normalizedStatus === "cancelled";

  return {
    providerReference,
    providerOrderId,
    providerShipmentId,
    awb,
    courierName,
    status,
    statusCode,
    cancelled,
    pickupAlreadyProgressed: pickupProgressed(statusCode),
  };
}

/**
 * Shiprocket custom order ids must be unique. Use a deterministic, compact,
 * ASCII-safe reference scoped to RINADS order + package so one multi-package
 * order can create multiple provider shipments without collisions.
 */
export function createShiprocketProviderReference(
  orderId: string,
  packageId: string
): string {
  const order = orderId.trim();
  const pkg = packageId.trim();
  if (!order || !pkg) {
    throw new ShiprocketApiError(
      "Shiprocket provider reference requires orderId and packageId."
    );
  }
  const prefix =
    order
      .replace(/[^A-Za-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 20) || "ORDER";
  const digest = createHash("sha256")
    .update(`${order}:${pkg}`)
    .digest("hex")
    .slice(0, 16);
  return `RIN-${prefix}-${digest}`.slice(0, 50);
}

export class ShiprocketOrderRecoveryClient {
  private readonly email: string;
  private readonly password: string;
  private readonly fetchImpl: ShiprocketFetch;
  private readonly now: () => number;
  private token: string | null = null;
  private tokenRefreshAtMs = 0;

  constructor(options: ShiprocketOrderRecoveryClientOptions) {
    this.email = options.email.trim();
    this.password = options.password.trim();
    if (!this.email) {
      throw new ShiprocketApiError("Shiprocket API user email is required.");
    }
    if (!this.password) {
      throw new ShiprocketApiError("Shiprocket API user password is required.");
    }
    this.fetchImpl = options.fetchImpl ?? defaultFetch;
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
        `Shiprocket recovery authentication failed with HTTP ${response.status}.`,
        response.status
      );
    }
    const payload = asRecord(
      parseJson(await response.text(), "recovery authentication")
    );
    const token = text(payload?.token);
    if (!token) {
      throw new ShiprocketApiError(
        "Shiprocket recovery authentication response did not contain a token."
      );
    }
    this.token = token;
    this.tokenRefreshAtMs = this.now() + TOKEN_REFRESH_MS;
    return token;
  }

  private async getOrders(
    params: URLSearchParams
  ): Promise<ShiprocketRecoveredOrder[]> {
    const token = await this.authenticate();
    const response = await this.fetchImpl(
      `${BASE_URL}/v1/external/orders?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      if (response.status === 401) {
        this.token = null;
        this.tokenRefreshAtMs = 0;
      }
      throw new ShiprocketApiError(
        `Shiprocket order recovery failed with HTTP ${response.status}.`,
        response.status
      );
    }
    return orderRows(parseJson(await response.text(), "order recovery"))
      .map(mapOrder)
      .filter((order): order is ShiprocketRecoveredOrder => Boolean(order));
  }

  async findByMerchantReference(
    providerReference: string
  ): Promise<ShiprocketRecoveredOrder | null> {
    const reference = providerReference.trim();
    if (!reference) {
      throw new ShiprocketApiError("providerReference is required.");
    }
    const rows = await this.getOrders(
      new URLSearchParams({
        filter_by: "channel_order_id",
        filter: reference,
        per_page: "10",
      })
    );
    const exact = rows.filter((row) => row.providerReference === reference);
    if (exact.length > 1) {
      throw new ShiprocketApiError(
        `Shiprocket returned multiple exact orders for provider reference ${reference}; manual reconciliation is required.`
      );
    }
    return exact[0] ?? null;
  }

  async findByAwb(awb: string): Promise<ShiprocketRecoveredOrder | null> {
    const normalized = awb.trim();
    if (!normalized) throw new ShiprocketApiError("AWB is required.");
    const rows = await this.getOrders(
      new URLSearchParams({ search: normalized, per_page: "10" })
    );
    const exact = rows.filter((row) => row.awb === normalized);
    if (exact.length > 1) {
      throw new ShiprocketApiError(
        `Shiprocket returned multiple exact orders for AWB ${normalized}; manual reconciliation is required.`
      );
    }
    return exact[0] ?? null;
  }
}

export function createShiprocketOrderRecoveryClientFromProviderConfig(
  config: Pick<
    LogisticsProviderConfig,
    "providerKey" | "credentialSource" | "credentialKey"
  >,
  options: Omit<ShiprocketOrderRecoveryClientOptions, "email" | "password"> = {},
  env: Readonly<Record<string, string | undefined>> = process.env
): ShiprocketOrderRecoveryClient {
  if (config.providerKey !== "shiprocket") {
    throw new ShiprocketApiError(
      "Shiprocket recovery client requires providerKey=shiprocket."
    );
  }
  const resolution = resolveLogisticsCredentialBinding(config, env);
  if (!resolution.ok) {
    throw new ShiprocketApiError(
      `Shiprocket recovery credential binding is unavailable: ${resolution.status}.`
    );
  }
  const email = resolution.bundle.values.email;
  const password = resolution.bundle.values.password;
  if (!email || !password) {
    throw new ShiprocketApiError(
      "Shiprocket recovery credential bundle is missing email/password."
    );
  }
  return new ShiprocketOrderRecoveryClient({ ...options, email, password });
}

function rowToRecovery(
  row: Record<string, unknown>
): ShiprocketRecoveryRecord | null {
  const organizationId = text(row.organization_id);
  const orderId = text(row.order_id);
  const packageId = text(row.package_id);
  const providerReference = text(row.provider_reference);
  if (!organizationId || !orderId || !packageId || !providerReference) {
    return null;
  }
  const metadata = asRecord(row.provider_metadata);
  return {
    organizationId,
    orderId,
    packageId,
    providerReference,
    providerOrderId: text(row.provider_order_id),
    providerShipmentId: text(row.provider_shipment_id),
    awb: text(row.awb),
    service: text(row.service),
    trackingUrl: text(row.tracking_url),
    providerStatus: text(metadata?.providerStatus),
    providerStatusCode: numeric(metadata?.providerStatusCode),
    recovered: metadata?.recovered === true,
  };
}

/**
 * Service-role persistence for provider recovery. This module intentionally uses
 * the Supabase REST endpoint directly so operations-server does not acquire a
 * browser/client database package dependency. Secret values remain server-only.
 */
export function createShiprocketSupabaseRecoveryStoreFromEnv(
  organizationId: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
  fetchImpl: ShiprocketFetch = defaultFetch
): ShiprocketRecoveryStore | null {
  const baseUrl =
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() || env.SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!baseUrl || !serviceRoleKey) return null;

  const endpoint = `${baseUrl.replace(/\/$/, "")}/rest/v1/shipments`;
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  return {
    async find(providerReference) {
      const params = new URLSearchParams({
        select:
          "organization_id,order_id,package_id,provider_reference,provider_order_id,provider_shipment_id,awb,service,tracking_url,provider_metadata",
        organization_id: `eq.${organizationId}`,
        carrier: "eq.shiprocket",
        provider_reference: `eq.${providerReference}`,
        limit: "1",
      });
      const response = await fetchImpl(`${endpoint}?${params.toString()}`, {
        method: "GET",
        headers,
      });
      if (!response.ok) {
        throw new ShiprocketApiError(
          `Unable to read Shiprocket recovery ledger: HTTP ${response.status}.`,
          response.status
        );
      }
      const payload = parseJson(await response.text(), "Supabase recovery read");
      const rows = Array.isArray(payload) ? payload : [];
      const row = asRecord(rows[0]);
      return row ? rowToRecovery(row) : null;
    },

    async save(record) {
      if (record.organizationId !== organizationId) {
        throw new ShiprocketApiError(
          "Shiprocket recovery record organization mismatch."
        );
      }
      const now = new Date().toISOString();
      const row: Record<string, unknown> = {
        organization_id: record.organizationId,
        order_id: record.orderId,
        package_id: record.packageId,
        carrier: "shiprocket",
        service: record.service ?? null,
        awb: record.awb ?? null,
        tracking_url: record.trackingUrl ?? null,
        status: record.awb ? "label_created" : "pending",
        provider_reference: record.providerReference,
        provider_order_id: record.providerOrderId ?? null,
        provider_shipment_id: record.providerShipmentId ?? null,
        provider_metadata: {
          providerStatus: record.providerStatus ?? null,
          providerStatusCode: record.providerStatusCode ?? null,
          recovered: record.recovered,
        },
        shipped_at: record.awb ? now : null,
        updated_at: now,
      };
      const params = new URLSearchParams({
        on_conflict: "organization_id,carrier,provider_reference",
      });
      const response = await fetchImpl(`${endpoint}?${params.toString()}`, {
        method: "POST",
        headers: {
          ...headers,
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(row),
      });
      if (!response.ok) {
        throw new ShiprocketApiError(
          `Unable to persist Shiprocket recovery ledger: HTTP ${response.status}.`,
          response.status
        );
      }
    },
  };
}
