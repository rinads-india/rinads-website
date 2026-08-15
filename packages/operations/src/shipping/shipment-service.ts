import type { OperationsRepository } from "../repository";
import { err, ok } from "../result";
import type {
  DeliveryEvent,
  DeliveryEventType,
  OperationsContext,
  Result,
  Shipment,
  ShipmentStatus,
} from "../types";

export type CourierAdapter = {
  createShipment(input: {
    orderId: string;
    packageId: string;
    weightGrams?: number;
    destinationPincode?: string;
  }): Promise<{ carrier: string; awb: string; trackingUrl: string; service?: string }>;
  cancelShipment(awb: string): Promise<{ cancelled: boolean }>;
  trackShipment(awb: string): Promise<{ events: { type: DeliveryEventType; label: string; occurredAt: string }[] }>;
  getLabel(awb: string): Promise<{ labelUrl?: string }>;
};

export class DemoCourierAdapter implements CourierAdapter {
  async createShipment(input: {
    orderId: string;
    packageId: string;
  }): Promise<{ carrier: string; awb: string; trackingUrl: string; service?: string }> {
    const awb = `DEMO${Date.now()}`;
    return {
      carrier: "demo_courier",
      awb,
      trackingUrl: `https://track.demo.local/${awb}`,
      service: "standard",
    };
  }

  async cancelShipment(): Promise<{ cancelled: boolean }> {
    return { cancelled: true };
  }

  async trackShipment(awb: string): Promise<{ events: { type: DeliveryEventType; label: string; occurredAt: string }[] }> {
    return {
      events: [
        { type: "label_created", label: "Label created", occurredAt: new Date().toISOString() },
        { type: "in_transit", label: "In transit", occurredAt: new Date().toISOString() },
      ],
    };
  }

  async getLabel(): Promise<{ labelUrl?: string }> {
    return { labelUrl: undefined };
  }
}

export class ShipmentService {
  constructor(
    private readonly repo: OperationsRepository,
    private readonly courier: CourierAdapter = new DemoCourierAdapter()
  ) {}

  async createShipment(
    ctx: OperationsContext,
    input: { orderId: string; packageId: string; weightGrams?: number; destinationPincode?: string }
  ): Promise<Result<Shipment>> {
    const store = this.repo.getStore();
    const pkg = store.packages.find(
      (p) => p.id === input.packageId && p.organizationId === ctx.organizationId
    );
    if (!pkg) return err("PACKAGE_NOT_FOUND", "Package not found.");

    const courierResult = await this.courier.createShipment(input);
    const shipment: Shipment = {
      id: this.repo.nextId("shp"),
      organizationId: ctx.organizationId,
      orderId: input.orderId,
      packageId: input.packageId,
      carrier: courierResult.carrier,
      service: courierResult.service,
      awb: courierResult.awb,
      trackingUrl: courierResult.trackingUrl,
      status: "label_created",
      shippedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    store.shipments.push(shipment);
    this.recordEvent(shipment.id, "label_created", "Shipping label created");
    this.repo.saveStore(store);
    return ok(shipment);
  }

  recordEvent(shipmentId: string, eventType: DeliveryEventType, label: string): DeliveryEvent {
    const store = this.repo.getStore();
    const event: DeliveryEvent = {
      id: this.repo.nextId("dev"),
      shipmentId,
      eventType,
      label,
      occurredAt: new Date().toISOString(),
    };
    store.deliveryEvents.push(event);

    const shipment = store.shipments.find((s) => s.id === shipmentId);
    if (shipment) {
      const statusMap: Partial<Record<DeliveryEventType, ShipmentStatus>> = {
        label_created: "label_created",
        picked_up: "picked_up",
        in_transit: "in_transit",
        out_for_delivery: "out_for_delivery",
        delivered: "delivered",
        failed: "failed",
        returned: "returned",
      };
      if (statusMap[eventType]) shipment.status = statusMap[eventType]!;
      if (eventType === "delivered") shipment.deliveredAt = event.occurredAt;
    }
    this.repo.saveStore(store);
    return event;
  }

  list(ctx: OperationsContext): Shipment[] {
    return this.repo
      .getStore()
      .shipments.filter((s) => s.organizationId === ctx.organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getEvents(shipmentId: string): DeliveryEvent[] {
    return this.repo
      .getStore()
      .deliveryEvents.filter((e) => e.shipmentId === shipmentId)
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  }

  delayedShipments(ctx: OperationsContext, hoursThreshold = 48): Shipment[] {
    const cutoff = Date.now() - hoursThreshold * 3600 * 1000;
    return this.list(ctx).filter(
      (s) =>
        !["delivered", "cancelled", "returned"].includes(s.status) &&
        s.shippedAt &&
        new Date(s.shippedAt).getTime() < cutoff
    );
  }
}
