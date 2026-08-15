import type { CommerceRepository, CommerceStore } from "@rinads/commerce";
import { createOrgScopedCommerceRepository, seedOrgCommerceStore } from "./org-scoped";
import {
  mapAddressRow,
  mapCartRow,
  mapCustomerRow,
  mapOrderRow,
  mapProductRow,
  mapPromotionRow,
  mapShippingMethodRow,
  mapVariantRow,
} from "./supabase-mappers";

type UpsertResult = Promise<{ error: { message: string } | null }>;

export type CommerceSupabaseClient = {
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

export type SupabaseCommerceOptions = {
  organizationId: string;
  client?: CommerceSupabaseClient;
  initialStore?: CommerceStore;
};

export function createSupabaseCommerceRepository(options: SupabaseCommerceOptions): CommerceRepository {
  const base = options.initialStore
    ? seedOrgCommerceStore(options.organizationId, options.initialStore)
    : createOrgScopedCommerceRepository(options.organizationId);

  if (!options.client) return base;

  const client = options.client;
  const orgId = options.organizationId;

  return {
    getStore: () => base.getStore(),
    saveStore: (store) => {
      base.saveStore(store);
      void syncCommerceToSupabase(client, orgId, store);
    },
    nextId: (prefix) => base.nextId(prefix),
    nextOrderNumber: (oid) => base.nextOrderNumber(oid),
  };
}

async function syncCommerceToSupabase(
  client: CommerceSupabaseClient,
  orgId: string,
  store: CommerceStore
): Promise<void> {
  const orgProducts = store.products.filter((p) => p.organizationId === orgId);
  if (orgProducts.length) {
    await client.from("products").upsert(
      orgProducts.map((p) => ({
        id: p.id,
        organization_id: orgId,
        name: p.name,
        slug: p.slug,
        description: p.description,
        status: p.status,
        category_slug: p.categorySlug,
        tags: p.tags,
        seo_title: p.seoTitle ?? null,
        seo_description: p.seoDescription ?? null,
        rating_avg: p.ratingAvg,
        rating_count: p.ratingCount,
      }))
    );
  }

  const orgVariants = store.variants.filter((v) => v.organizationId === orgId);
  if (orgVariants.length) {
    await client.from("product_variants").upsert(
      orgVariants.map((v) => ({
        id: v.id,
        organization_id: orgId,
        product_id: v.productId,
        name: v.name,
        sku: v.sku,
        price: v.price,
        compare_at_price: v.compareAtPrice ?? null,
        stock: v.stock,
        weight_grams: v.weightGrams ?? null,
        status: v.status,
      }))
    );
  }

  const shipping = store.shippingMethods.filter((s) => s.organizationId === orgId);
  if (shipping.length) {
    await client.from("shipping_methods").upsert(
      shipping.map((s) => ({
        id: s.id,
        organization_id: orgId,
        code: s.code,
        name: s.name,
        base_rate: s.baseRate,
        free_above: s.freeAbove ?? null,
        is_active: s.isActive,
      }))
    );
  }

  const promos = store.promotions.filter((p) => p.organizationId === orgId);
  if (promos.length) {
    await client.from("promotions").upsert(
      promos.map((p) => ({
        id: p.id,
        organization_id: orgId,
        code: p.code,
        type: p.type,
        value: p.value,
        min_cart_total: p.minCartTotal ?? null,
        max_discount: p.maxDiscount ?? null,
        usage_limit: p.usageLimit ?? null,
        usage_count: p.usageCount,
        is_active: p.isActive,
        stackable: p.stackable,
      }))
    );
  }

  const customers = store.customers.filter((c) => c.organizationId === orgId);
  if (customers.length) {
    await client.from("customer_profiles").upsert(
      customers.map((c) => ({
        id: c.id,
        organization_id: orgId,
        user_id: c.userId,
        email: c.email ?? null,
        phone: c.phone ?? null,
        marketing_opt_in: c.marketingOptIn,
      }))
    );
  }

  const addresses = store.addresses.filter((a) => a.organizationId === orgId);
  if (addresses.length) {
    await client.from("addresses").upsert(
      addresses.map((a) => ({
        id: a.id,
        organization_id: orgId,
        customer_id: a.customerId,
        label: a.label ?? null,
        name: a.name,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2 ?? null,
        city: a.city,
        state: a.state,
        pincode: a.pincode,
        is_default: a.isDefault,
      }))
    );
  }

  const orgCarts = store.carts.filter((c) => c.organizationId === orgId);
  if (orgCarts.length) {
    await client.from("carts").upsert(
      orgCarts.map((c) => ({
        id: c.id,
        organization_id: orgId,
        customer_id: c.customerId ?? null,
        guest_token: c.guestToken ?? null,
        currency: c.currency,
        updated_at: c.updatedAt,
      }))
    );
    const cartLines = orgCarts.flatMap((c) =>
      c.lines.map((line) => ({
        id: line.id,
        cart_id: c.id,
        variant_id: line.variantId,
        quantity: line.quantity,
      }))
    );
    if (cartLines.length) {
      await client.from("cart_lines").upsert(cartLines);
    }
  }

  const orgOrders = store.orders.filter((o) => o.organizationId === orgId);
  if (orgOrders.length) {
    await client.from("orders").upsert(
      orgOrders.map((o) => ({
        id: o.id,
        organization_id: orgId,
        customer_id: o.customerId ?? null,
        order_number: o.orderNumber,
        status: o.status,
        payment_status: o.paymentStatus,
        fulfilment_status: o.fulfilmentStatus,
        subtotal: o.subtotal,
        discount_total: o.discountTotal,
        shipping_total: o.shippingTotal,
        tax_total: o.taxTotal,
        grand_total: o.grandTotal,
        currency: o.currency,
        shipping_method_code: o.shippingMethodCode ?? null,
        promotion_code: o.promotionCode ?? null,
        guest_email: o.guestEmail ?? null,
        created_at: o.createdAt,
      }))
    );

    const orderLines = orgOrders.flatMap((o) =>
      o.lines.map((line) => ({
        id: line.id,
        order_id: o.id,
        variant_id: line.variantId ?? null,
        product_name: line.productName,
        variant_name: line.variantName,
        sku: line.sku,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        tax_amount: line.taxAmount,
        discount_amount: line.discountAmount,
        image_url: line.imageUrl ?? null,
      }))
    );
    if (orderLines.length) {
      await client.from("order_lines").upsert(orderLines);
    }

    const orderEvents = orgOrders.flatMap((o) =>
      o.events.map((e) => ({
        id: e.id,
        order_id: o.id,
        event_type: e.eventType,
        label: e.label,
        occurred_at: e.occurredAt,
      }))
    );
    if (orderEvents.length) {
      await client.from("order_events").upsert(orderEvents);
    }
  }
}

export async function loadCommerceStoreFromSupabase(
  client: CommerceSupabaseClient,
  organizationId: string
): Promise<CommerceStore | null> {
  const { data: products, error: pErr } = await client
    .from("products")
    .select("*")
    .eq("organization_id", organizationId);
  if (pErr || !products?.length) return null;

  const fetch = (table: string) =>
    client.from(table).select("*").eq("organization_id", organizationId);

  const [
    { data: variants },
    { data: shipping },
    { data: promos },
    { data: customers },
    { data: addresses },
    { data: carts },
    { data: orders },
  ] = await Promise.all([
    fetch("product_variants"),
    fetch("shipping_methods"),
    fetch("promotions"),
    fetch("customer_profiles"),
    fetch("addresses"),
    fetch("carts"),
    fetch("orders"),
  ]);

  const cartIds = (carts ?? []).map((c) => String(c.id));
  let cartLineRows: Record<string, unknown>[] = [];
  if (cartIds.length) {
    const allLines = await Promise.all(
      cartIds.map((id) =>
        client
          .from("cart_lines")
          .select("*")
          .eq("cart_id", id)
          .then((r) => r.data ?? [])
      )
    );
    cartLineRows = allLines.flat();
  }

  const orderIds = (orders ?? []).map((o) => String(o.id));
  let orderLineRows: Record<string, unknown>[] = [];
  let orderEventRows: Record<string, unknown>[] = [];
  if (orderIds.length) {
    const [lines, events] = await Promise.all([
      Promise.all(
        orderIds.map((id) =>
          client.from("order_lines").select("*").eq("order_id", id).then((r) => r.data ?? [])
        )
      ),
      Promise.all(
        orderIds.map((id) =>
          client.from("order_events").select("*").eq("order_id", id).then((r) => r.data ?? [])
        )
      ),
    ]);
    orderLineRows = lines.flat();
    orderEventRows = events.flat();
  }

  const mappedCarts = (carts ?? []).map((row) => {
    const cartId = String(row.id);
    const lines = cartLineRows
      .filter((l) => String(l.cart_id) === cartId)
      .map((l) => ({
        id: String(l.id),
        variantId: String(l.variant_id),
        quantity: Number(l.quantity),
      }));
    return mapCartRow(row, organizationId, lines);
  });

  const mappedOrders = (orders ?? []).map((row) => {
    const orderId = String(row.id);
    const lines = orderLineRows
      .filter((l) => String(l.order_id) === orderId)
      .map((l) => ({
        id: String(l.id),
        variantId: l.variant_id ? String(l.variant_id) : undefined,
        productName: String(l.product_name),
        variantName: String(l.variant_name),
        sku: String(l.sku),
        quantity: Number(l.quantity),
        unitPrice: Number(l.unit_price),
        taxAmount: Number(l.tax_amount ?? 0),
        discountAmount: Number(l.discount_amount ?? 0),
        imageUrl: l.image_url ? String(l.image_url) : undefined,
      }));
    const events = orderEventRows
      .filter((e) => String(e.order_id) === orderId)
      .map((e) => ({
        id: String(e.id),
        eventType: String(e.event_type),
        label: String(e.label),
        occurredAt: String(e.occurred_at),
      }));
    return mapOrderRow(row, organizationId, lines, events);
  });

  return {
    products: products.map((row) => mapProductRow(row, organizationId)),
    variants: (variants ?? []).map((row) => mapVariantRow(row, organizationId)),
    media: [],
    carts: mappedCarts,
    orders: mappedOrders,
    customers: (customers ?? []).map((row) => mapCustomerRow(row, organizationId)),
    addresses: (addresses ?? []).map((row) => mapAddressRow(row, organizationId)),
    shippingMethods: (shipping ?? []).map((row) => mapShippingMethodRow(row, organizationId)),
    promotions: (promos ?? []).map((row) => mapPromotionRow(row, organizationId)),
    reviews: [],
    wishlists: [],
    productViews: [],
    tickets: [],
    taxRatePercent: 5,
  };
}
