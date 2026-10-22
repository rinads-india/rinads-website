import type {
  CourierAdapter,
  CourierProviderDefinition,
  CourierQuoteInput,
  CourierRoutingEvidence,
  CourierShipmentExecution,
  CourierShipmentInput,
  DeliveryEventType,
  LogisticsProviderConfig,
} from "@rinads/operations";
import {
  ShiprocketApiError,
  type ShiprocketClient,
  type ShiprocketCourierOption,
} from "./shiprocket";
import {
  ShiprocketExecutionClient,
  createShiprocketExecutionClientFromProviderConfig,
} from "./shiprocket-execution-client";
import { normalizeShiprocketWebhook } from "./shiprocket-webhook";

export type ShiprocketAdapterOptions = {
  requestPickup?: boolean;
  generateLabel?: boolean;
};

type ValidatedExecution = CourierShipmentExecution & {
  pickupLocation: string;
  dimensionsCm: NonNullable<CourierShipmentExecution["dimensionsCm"]>;
};

function minorToRupees(value: number | undefined, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ShiprocketApiError(
      `${field} must be a non-negative integer in minor currency units.`
    );
  }
  return value / 100;
}

function bestCourier(couriers: readonly ShiprocketCourierOption[]): ShiprocketCourierOption | null {
  const candidates = couriers.filter((courier) => courier.rateRupees !== undefined);
  candidates.sort((a, b) => {
    const rate =
      (a.rateRupees ?? Number.POSITIVE_INFINITY) -
      (b.rateRupees ?? Number.POSITIVE_INFINITY);
    if (rate !== 0) return rate;
    const eta =
      (a.etdHours ?? Number.POSITIVE_INFINITY) -
      (b.etdHours ?? Number.POSITIVE_INFINITY);
    if (eta !== 0) return eta;
    return a.courierCompanyId - b.courierCompanyId;
  });
  return candidates[0] ?? couriers[0] ?? null;
}

function scoreToRatio(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value) || value < 0 || value > 5) {
    return undefined;
  }
  return value / 5;
}

async function resolveCourier(
  client: ShiprocketClient,
  input: Pick<
    CourierQuoteInput,
    | "pickupPincode"
    | "destinationPincode"
    | "weightGrams"
    | "codAmountMinor"
    | "dimensionsCm"
    | "declaredValueMinor"
  >
): Promise<ShiprocketCourierOption | null> {
  if (!input.pickupPincode || !input.destinationPincode || !input.weightGrams) {
    return null;
  }

  const result = await client.checkServiceability({
    pickupPincode: input.pickupPincode,
    deliveryPincode: input.destinationPincode,
    weightKg: input.weightGrams / 1000,
    cod: (input.codAmountMinor ?? 0) > 0,
    dimensionsCm: input.dimensionsCm
      ? {
          length: input.dimensionsCm.length,
          breadth: input.dimensionsCm.width,
          height: input.dimensionsCm.height,
        }
      : undefined,
    declaredValueRupees: minorToRupees(
      input.declaredValueMinor,
      "declaredValueMinor"
    ),
  });

  return bestCourier(result.couriers);
}

function requireExecution(input: CourierShipmentInput): {
  execution: ValidatedExecution;
  weightGrams: number;
} {
  if (!input.execution) {
    throw new ShiprocketApiError(
      "Shiprocket execution requires the authorized canonical fulfilment payload."
    );
  }
  if (!input.weightGrams || input.weightGrams <= 0) {
    throw new ShiprocketApiError("Shiprocket execution requires weightGrams.");
  }
  const pickupLocation = input.execution.pickupLocation?.trim();
  if (!pickupLocation) {
    throw new ShiprocketApiError(
      "Shiprocket execution requires an existing pickupLocation from the seller account."
    );
  }
  if (!input.execution.dimensionsCm) {
    throw new ShiprocketApiError("Shiprocket execution requires package dimensions.");
  }
  const { length, width, height } = input.execution.dimensionsCm;
  if (
    ![length, width, height].every(
      (value) => Number.isFinite(value) && value > 0.5
    )
  ) {
    throw new ShiprocketApiError(
      "Shiprocket package length, width and height must each be greater than 0.5 cm."
    );
  }
  return {
    execution: {
      ...input.execution,
      pickupLocation,
      dimensionsCm: input.execution.dimensionsCm,
    },
    weightGrams: input.weightGrams,
  };
}

export class ShiprocketCourierAdapter implements CourierAdapter {
  private readonly shipmentIdByAwb = new Map<string, number>();

  constructor(
    private readonly client: ShiprocketExecutionClient,
    private readonly options: ShiprocketAdapterOptions = {}
  ) {}

  async createShipment(input: CourierShipmentInput): Promise<{
    carrier: string;
    awb: string;
    trackingUrl: string;
    service?: string;
    providerShipmentId?: string;
    providerOrderId?: string;
  }> {
    const { execution, weightGrams } = requireExecution(input);
    const routing = input as CourierShipmentInput & Partial<CourierQuoteInput>;
    const selectedCourier = await resolveCourier(this.client, routing);
    if (!selectedCourier) {
      throw new ShiprocketApiError(
        "Shiprocket has no serviceable courier for the execution route."
      );
    }

    const order = await this.client.createCustomOrder({
      orderId: input.orderId,
      orderDate: execution.orderDate,
      pickupLocation: execution.pickupLocation,
      companyName: execution.billing.companyName,
      billing: {
        customerName: execution.billing.name,
        lastName: execution.billing.lastName,
        address: execution.billing.address1,
        address2: execution.billing.address2,
        city: execution.billing.city,
        pincode: execution.billing.pincode,
        state: execution.billing.state,
        country: execution.billing.country,
        email: execution.billing.email,
        phone: execution.billing.phone,
        alternatePhone: execution.billing.alternatePhone,
      },
      shipping: execution.shipping
        ? {
            customerName: execution.shipping.name,
            lastName: execution.shipping.lastName,
            address: execution.shipping.address1,
            address2: execution.shipping.address2,
            city: execution.shipping.city,
            pincode: execution.shipping.pincode,
            state: execution.shipping.state,
            country: execution.shipping.country,
            email: execution.shipping.email,
            phone: execution.shipping.phone,
            alternatePhone: execution.shipping.alternatePhone,
          }
        : undefined,
      items: execution.items.map((item) => ({
        name: item.name,
        sku: item.sku,
        units: item.units,
        sellingPriceRupees:
          minorToRupees(item.sellingPriceMinor, "item.sellingPriceMinor") ?? 0,
        discountRupees: minorToRupees(
          item.discountMinor,
          "item.discountMinor"
        ),
        taxRupees: minorToRupees(item.taxMinor, "item.taxMinor"),
        hsn: item.hsn,
      })),
      paymentMethod: execution.paymentMethod === "cod" ? "COD" : "Prepaid",
      shippingChargesRupees: minorToRupees(
        execution.shippingChargesMinor,
        "shippingChargesMinor"
      ),
      totalDiscountRupees: minorToRupees(
        execution.totalDiscountMinor,
        "totalDiscountMinor"
      ),
      subTotalRupees:
        minorToRupees(execution.subtotalMinor, "subtotalMinor") ?? 0,
      dimensionsCm: {
        length: execution.dimensionsCm.length,
        breadth: execution.dimensionsCm.width,
        height: execution.dimensionsCm.height,
      },
      weightKg: weightGrams / 1000,
    });

    const awb = await this.client.assignAwb(
      order.shipmentId,
      selectedCourier.courierCompanyId
    );
    if (!awb.assigned || !awb.awb) {
      throw new ShiprocketApiError(
        `Shiprocket created shipment ${order.shipmentId} but did not assign an AWB.`
      );
    }

    this.shipmentIdByAwb.set(awb.awb, order.shipmentId);

    if (this.options.requestPickup === true) {
      const pickup = await this.client.requestPickup(order.shipmentId);
      if (!pickup.scheduled) {
        throw new ShiprocketApiError(
          `Shiprocket assigned AWB ${awb.awb} but pickup scheduling was not confirmed.`
        );
      }
    }

    if (this.options.generateLabel === true) {
      const label = await this.client.generateLabel([order.shipmentId]);
      if (!label.created) {
        throw new ShiprocketApiError(
          `Shiprocket assigned AWB ${awb.awb} but label generation was not confirmed.`
        );
      }
    }

    return {
      carrier: "shiprocket",
      awb: awb.awb,
      trackingUrl: `https://shiprocket.co/tracking/${encodeURIComponent(awb.awb)}`,
      service: awb.courierName ?? selectedCourier.courierName,
      providerShipmentId: String(order.shipmentId),
      providerOrderId: String(order.orderId),
    };
  }

  async cancelShipment(awb: string): Promise<{ cancelled: boolean }> {
    await this.client.cancelShipment([awb]);
    return { cancelled: true };
  }

  async trackShipment(awb: string): Promise<{
    events: { type: DeliveryEventType; label: string; occurredAt: string }[];
  }> {
    const tracking = await this.client.trackByAwb(awb);
    const activityEvents = tracking.events.flatMap((activity) => {
      const statusId = activity.shiprocketStatusCode
        ? Number(activity.shiprocketStatusCode)
        : undefined;
      try {
        const normalized = normalizeShiprocketWebhook({
          awb: tracking.awb ?? awb,
          courier_name: tracking.courierName,
          current_status:
            activity.shiprocketStatusLabel ?? activity.activity ?? activity.status,
          shipment_status_id:
            statusId !== undefined && Number.isFinite(statusId)
              ? statusId
              : undefined,
          current_timestamp: activity.occurredAt,
        });
        return [normalized.event];
      } catch {
        return [];
      }
    });

    if (activityEvents.length > 0) return { events: activityEvents };
    if (!tracking.trackingAvailable) return { events: [] };

    const current = normalizeShiprocketWebhook({
      awb: tracking.awb ?? awb,
      courier_name: tracking.courierName,
      current_status: tracking.currentStatus,
      current_status_id: tracking.currentStatusId,
      shipment_status_id: tracking.shipmentStatusId,
      current_timestamp: tracking.deliveredAt ?? tracking.estimatedDeliveryAt,
    });
    return { events: [current.event] };
  }

  async getLabel(awb: string): Promise<{ labelUrl?: string }> {
    const shipmentId = this.shipmentIdByAwb.get(awb);
    if (!shipmentId) return { labelUrl: undefined };
    const label = await this.client.generateLabel([shipmentId]);
    return { labelUrl: label.labelUrl };
  }
}

export function createShiprocketProviderDefinition(options: {
  client: ShiprocketExecutionClient;
  adapter?: ShiprocketCourierAdapter;
  enabled?: boolean;
  priority?: number;
}): CourierProviderDefinition {
  const adapter =
    options.adapter ?? new ShiprocketCourierAdapter(options.client);
  const intelligenceByOrder = new Map<string, CourierRoutingEvidence>();

  return {
    key: "shiprocket",
    adapter,
    enabled: options.enabled ?? false,
    priority: options.priority ?? 50,
    capabilities: ["cod", "reverse", "scheduled"],
    async quote(input) {
      const courier = await resolveCourier(options.client, input);
      if (!courier) {
        intelligenceByOrder.delete(`${input.orderId}:${input.packageId}`);
        return {
          providerKey: "shiprocket",
          serviceable: false,
          reason:
            "No Shiprocket courier is serviceable for the supplied route evidence.",
        };
      }

      intelligenceByOrder.set(`${input.orderId}:${input.packageId}`, {
        deliverySuccessRate: scoreToRatio(courier.deliveryPerformance),
        slaConfidence: scoreToRatio(courier.rating),
      });

      return {
        providerKey: "shiprocket",
        serviceable: true,
        service: courier.courierName,
        estimatedCostMinor:
          courier.rateRupees === undefined
            ? undefined
            : Math.round(courier.rateRupees * 100),
        etaHours: courier.etdHours,
      };
    },
    intelligence(input) {
      return (
        intelligenceByOrder.get(`${input.orderId}:${input.packageId}`) ?? {}
      );
    },
  };
}

export function createShiprocketProviderFromConfig(
  config: LogisticsProviderConfig,
  options: ShiprocketAdapterOptions & { priority?: number } = {},
  env: Readonly<Record<string, string | undefined>> = process.env
): CourierProviderDefinition {
  const verificationEligible =
    config.verificationState === "sandbox_passed" ||
    config.verificationState === "controlled_shipment_passed";
  const writeEnabled =
    verificationEligible && env.RINADS_SHIPROCKET_WRITE_ENABLED === "1";

  const client = createShiprocketExecutionClientFromProviderConfig(
    config,
    { writeEnabled },
    env
  );
  const adapter = new ShiprocketCourierAdapter(client, options);
  return createShiprocketProviderDefinition({
    client,
    adapter,
    enabled: config.enabled,
    priority: options.priority ?? config.priority,
  });
}
