import type { OperationsRepository, OperationsStore } from "@rinads/operations";
import { createInMemoryOperationsRepository } from "./memory";

const orgOpsStores = new Map<string, OperationsRepository>();

type UpsertResult = Promise<{ error: { message: string } | null }>;

export type OperationsSupabaseClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (
        col: string,
        val: string
      ) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
    };
    upsert: (rows: Record<string, unknown>[]) => UpsertResult;
  };
};

export type SupabaseOperationsOptions = {
  organizationId: string;
  client?: OperationsSupabaseClient;
  initialStore?: OperationsStore;
};

export function createSupabaseOperationsRepository(
  options: SupabaseOperationsOptions
): OperationsRepository {
  let base = orgOpsStores.get(options.organizationId);
  if (!base) {
    base = createInMemoryOperationsRepository(options.initialStore);
    orgOpsStores.set(options.organizationId, base);
  }

  if (!options.client) return base;

  const client = options.client;
  const orgId = options.organizationId;

  return {
    getStore: () => base!.getStore(),
    saveStore: (store) => {
      base!.saveStore(store);
      void syncOperationsToSupabase(client, orgId, store);
    },
    nextId: (prefix) => base!.nextId(prefix),
    nextDocumentNumber: (oid, docType, prefix) =>
      base!.nextDocumentNumber(oid, docType, prefix),
  };
}

async function syncOperationsToSupabase(
  client: OperationsSupabaseClient,
  orgId: string,
  store: OperationsStore
): Promise<void> {
  const locations = store.locations.filter((l) => l.organizationId === orgId);
  if (locations.length) {
    await client.from("inventory_locations").upsert(
      locations.map((l) => ({
        id: l.id,
        organization_id: orgId,
        name: l.name,
        code: l.code,
        is_default: l.isDefault,
        is_sellable: l.isSellable,
        status: l.status,
        created_at: l.createdAt,
      }))
    );
  }

  const movements = store.movements.filter((m) => m.organizationId === orgId);
  if (movements.length) {
    await client.from("stock_movements").upsert(
      movements.map((m) => ({
        id: m.id,
        organization_id: orgId,
        variant_id: m.variantId,
        location_id: m.locationId,
        quantity_delta: m.quantityDelta,
        movement_type: m.movementType,
        reference_type: m.referenceType ?? null,
        reference_id: m.referenceId ?? null,
        reason: m.reason ?? null,
        performed_by: m.performedBy ?? null,
        created_at: m.createdAt,
      }))
    );
  }

  const suppliers = store.suppliers.filter((s) => s.organizationId === orgId);
  if (suppliers.length) {
    await client.from("suppliers").upsert(
      suppliers.map((s) => ({
        id: s.id,
        organization_id: orgId,
        name: s.name,
        contact_name: s.contactName ?? null,
        phone: s.phone ?? null,
        email: s.email ?? null,
        address: s.address ?? null,
        gstin: s.gstin ?? null,
        payment_terms: s.paymentTerms ?? null,
        status: s.status,
        notes: s.notes ?? null,
      }))
    );
  }

  const supplierProducts = store.supplierProducts.filter((s) => s.organizationId === orgId);
  if (supplierProducts.length) {
    await client.from("supplier_products").upsert(
      supplierProducts.map((s) => ({
        id: s.id,
        organization_id: orgId,
        supplier_id: s.supplierId,
        variant_id: s.variantId,
        supplier_sku: s.supplierSku ?? null,
        cost: s.cost,
        moq: s.moq ?? null,
        lead_time_days: s.leadTimeDays ?? null,
        is_preferred: s.isPreferred,
      }))
    );
  }

  const pos = store.purchaseOrders.filter((p) => p.organizationId === orgId);
  if (pos.length) {
    await client.from("purchase_orders").upsert(
      pos.map((p) => ({
        id: p.id,
        organization_id: orgId,
        po_number: p.poNumber,
        supplier_id: p.supplierId,
        status: p.status,
        subtotal: p.subtotal,
        tax_total: p.taxTotal,
        freight_cost: p.freightCost,
        discount_total: p.discountTotal,
        grand_total: p.grandTotal,
        expected_date: p.expectedDate ?? null,
        approved_by: p.approvedBy ?? null,
        notes: p.notes ?? null,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      }))
    );

    const poLines = pos.flatMap((po) =>
      store.purchaseOrderLines
        .filter((l) => l.purchaseOrderId === po.id)
        .map((l) => ({
          id: l.id,
          purchase_order_id: po.id,
          variant_id: l.variantId,
          quantity: l.quantity,
          quantity_received: l.quantityReceived,
          unit_cost: l.unitCost,
          tax_amount: l.taxAmount,
          discount_amount: l.discountAmount,
          expected_date: l.expectedDate ?? null,
          supplier_reference: l.supplierReference ?? null,
        }))
    );
    if (poLines.length) {
      await client.from("purchase_order_lines").upsert(poLines);
    }
  }

  const receipts = store.goodsReceipts.filter((g) => g.organizationId === orgId);
  if (receipts.length) {
    await client.from("goods_receipts").upsert(
      receipts.map((g) => ({
        id: g.id,
        organization_id: orgId,
        receipt_number: g.receiptNumber,
        purchase_order_id: g.purchaseOrderId,
        location_id: g.locationId,
        received_by: g.receivedBy ?? null,
        inspection_notes: g.inspectionNotes ?? null,
        created_at: g.createdAt,
      }))
    );

    const grLines = receipts.flatMap((gr) =>
      store.goodsReceiptLines
        .filter((l) => l.goodsReceiptId === gr.id)
        .map((l) => ({
          id: l.id,
          goods_receipt_id: gr.id,
          purchase_order_line_id: l.purchaseOrderLineId,
          variant_id: l.variantId,
          received_quantity: l.receivedQuantity,
          accepted_quantity: l.acceptedQuantity,
          damaged_quantity: l.damagedQuantity,
          short_quantity: l.shortQuantity,
          batch_reference: l.batchReference ?? null,
        }))
    );
    if (grLines.length) {
      await client.from("goods_receipt_lines").upsert(grLines);
    }
  }

  const events = store.businessEvents.filter((e) => e.organizationId === orgId);
  if (events.length) {
    await client.from("business_events").upsert(
      events.map((e) => ({
        id: e.id,
        organization_id: orgId,
        event_type: e.eventType,
        entity_type: e.entityType ?? null,
        entity_id: e.entityId ?? null,
        payload: e.payload,
        idempotency_key: e.idempotencyKey ?? null,
        created_at: e.createdAt,
      }))
    );
  }

  const logs = store.auditLogs.filter((a) => a.organizationId === orgId);
  if (logs.length) {
    await client.from("audit_logs").upsert(
      logs.map((a) => ({
        id: a.id,
        organization_id: orgId,
        actor_type: a.actorType,
        actor_id: a.actorId ?? null,
        action: a.action,
        entity: a.entity ?? null,
        entity_id: a.entityId ?? null,
        before: a.before ?? null,
        after: a.after ?? null,
        source: a.source ?? null,
        created_at: a.createdAt,
      }))
    );
  }
}

export async function loadOperationsStoreFromSupabase(
  client: OperationsSupabaseClient,
  organizationId: string
): Promise<OperationsStore | null> {
  const fetch = (table: string) =>
    client.from(table).select("*").eq("organization_id", organizationId);

  const { data: locations, error } = await fetch("inventory_locations");
  if (error || !locations?.length) return null;

  const [
    { data: movements },
    { data: suppliers },
    { data: supplierProducts },
    { data: pos },
    { data: receipts },
    { data: events },
    { data: logs },
  ] = await Promise.all([
    fetch("stock_movements"),
    fetch("suppliers"),
    fetch("supplier_products"),
    fetch("purchase_orders"),
    fetch("goods_receipts"),
    fetch("business_events"),
    fetch("audit_logs"),
  ]);

  const poIds = (pos ?? []).map((p) => String(p.id));
  let poLineRows: Record<string, unknown>[] = [];
  if (poIds.length) {
    const lines = await Promise.all(
      poIds.map((id) =>
        client.from("purchase_order_lines").select("*").eq("purchase_order_id", id).then((r) => r.data ?? [])
      )
    );
    poLineRows = lines.flat();
  }

  const grIds = (receipts ?? []).map((g) => String(g.id));
  let grLineRows: Record<string, unknown>[] = [];
  if (grIds.length) {
    const lines = await Promise.all(
      grIds.map((id) =>
        client.from("goods_receipt_lines").select("*").eq("goods_receipt_id", id).then((r) => r.data ?? [])
      )
    );
    grLineRows = lines.flat();
  }

  return {
    variantProfiles: [],
    locations: locations.map((row) => ({
      id: String(row.id),
      organizationId,
      name: String(row.name),
      code: String(row.code),
      isDefault: Boolean(row.is_default),
      isSellable: Boolean(row.is_sellable),
      status: row.status as "active" | "archived",
      createdAt: String(row.created_at),
    })),
    movements: (movements ?? []).map((row) => ({
      id: String(row.id),
      organizationId,
      variantId: String(row.variant_id),
      locationId: String(row.location_id),
      quantityDelta: Number(row.quantity_delta),
      movementType: row.movement_type as OperationsStore["movements"][0]["movementType"],
      referenceType: row.reference_type ? String(row.reference_type) : undefined,
      referenceId: row.reference_id ? String(row.reference_id) : undefined,
      reason: row.reason ? String(row.reason) : undefined,
      performedBy: row.performed_by ? String(row.performed_by) : undefined,
      createdAt: String(row.created_at),
    })),
    reservations: [],
    transfers: [],
    transferLines: [],
    suppliers: (suppliers ?? []).map((row) => ({
      id: String(row.id),
      organizationId,
      name: String(row.name),
      contactName: row.contact_name ? String(row.contact_name) : undefined,
      phone: row.phone ? String(row.phone) : undefined,
      email: row.email ? String(row.email) : undefined,
      address: row.address ? String(row.address) : undefined,
      gstin: row.gstin ? String(row.gstin) : undefined,
      paymentTerms: row.payment_terms ? String(row.payment_terms) : undefined,
      status: row.status as "active" | "inactive",
      notes: row.notes ? String(row.notes) : undefined,
      createdAt: String(row.created_at ?? new Date().toISOString()),
    })),
    supplierProducts: (supplierProducts ?? []).map((row) => ({
      id: String(row.id),
      organizationId,
      supplierId: String(row.supplier_id),
      variantId: String(row.variant_id),
      supplierSku: row.supplier_sku ? String(row.supplier_sku) : undefined,
      cost: Number(row.cost),
      moq: row.moq != null ? Number(row.moq) : undefined,
      leadTimeDays: row.lead_time_days != null ? Number(row.lead_time_days) : undefined,
      isPreferred: Boolean(row.is_preferred),
    })),
    purchaseApprovalRules: [],
    purchaseOrders: (pos ?? []).map((row) => ({
      id: String(row.id),
      organizationId,
      poNumber: String(row.po_number),
      supplierId: String(row.supplier_id),
      status: row.status as OperationsStore["purchaseOrders"][0]["status"],
      subtotal: Number(row.subtotal),
      taxTotal: Number(row.tax_total),
      freightCost: Number(row.freight_cost),
      discountTotal: Number(row.discount_total),
      grandTotal: Number(row.grand_total),
      expectedDate: row.expected_date ? String(row.expected_date) : undefined,
      approvedBy: row.approved_by ? String(row.approved_by) : undefined,
      notes: row.notes ? String(row.notes) : undefined,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    })),
    purchaseOrderLines: poLineRows.map((row) => ({
      id: String(row.id),
      purchaseOrderId: String(row.purchase_order_id),
      variantId: String(row.variant_id),
      quantity: Number(row.quantity),
      quantityReceived: Number(row.quantity_received ?? 0),
      unitCost: Number(row.unit_cost),
      taxAmount: Number(row.tax_amount ?? 0),
      discountAmount: Number(row.discount_amount ?? 0),
      expectedDate: row.expected_date ? String(row.expected_date) : undefined,
      supplierReference: row.supplier_reference ? String(row.supplier_reference) : undefined,
    })),
    goodsReceipts: (receipts ?? []).map((row) => ({
      id: String(row.id),
      organizationId,
      receiptNumber: String(row.receipt_number),
      purchaseOrderId: String(row.purchase_order_id),
      locationId: String(row.location_id),
      receivedBy: row.received_by ? String(row.received_by) : undefined,
      inspectionNotes: row.inspection_notes ? String(row.inspection_notes) : undefined,
      createdAt: String(row.created_at),
    })),
    goodsReceiptLines: grLineRows.map((row) => ({
      id: String(row.id),
      goodsReceiptId: String(row.goods_receipt_id),
      purchaseOrderLineId: String(row.purchase_order_line_id),
      variantId: row.variant_id ? String(row.variant_id) : "",
      receivedQuantity: Number(row.received_quantity),
      acceptedQuantity: Number(row.accepted_quantity),
      damagedQuantity: Number(row.damaged_quantity ?? 0),
      shortQuantity: Number(row.short_quantity ?? 0),
      batchReference: row.batch_reference ? String(row.batch_reference) : undefined,
    })),
    fulfilments: [],
    pickLists: [],
    pickListLines: [],
    packages: [],
    shipments: [],
    deliveryEvents: [],
    returnRequests: [],
    returnLines: [],
    refunds: [],
    tasks: [],
    alerts: [],
    priceHistory: [],
    expenseCategories: [],
    expenses: [],
    documentSequences: [],
    businessEvents: (events ?? []).map((row) => ({
      id: String(row.id),
      organizationId,
      eventType: String(row.event_type),
      entityType: row.entity_type ? String(row.entity_type) : undefined,
      entityId: row.entity_id ? String(row.entity_id) : undefined,
      payload: (row.payload as Record<string, unknown>) ?? {},
      idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : undefined,
      createdAt: String(row.created_at),
    })),
    auditLogs: (logs ?? []).map((row) => ({
      id: String(row.id),
      organizationId,
      actorType: row.actor_type as OperationsStore["auditLogs"][0]["actorType"],
      actorId: row.actor_id ? String(row.actor_id) : undefined,
      action: String(row.action),
      entity: String(row.entity ?? ""),
      entityId: String(row.entity_id ?? ""),
      before: row.before as Record<string, unknown> | undefined,
      after: row.after as Record<string, unknown> | undefined,
      source: row.source ? String(row.source) : undefined,
      createdAt: String(row.created_at),
    })),
  };
}

export function resetSupabaseOperationsRepositories(): void {
  orgOpsStores.clear();
}
