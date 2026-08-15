import type { CommerceStore } from "@rinads/commerce";

type Row = Record<string, unknown>;

export function mapProductRow(row: Row, organizationId: string) {
  return {
    id: String(row.id),
    organizationId,
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ""),
    status: row.status as CommerceStore["products"][0]["status"],
    categorySlug: String(row.category_slug ?? ""),
    tags: (row.tags as string[]) ?? [],
    seoTitle: row.seo_title ? String(row.seo_title) : undefined,
    seoDescription: row.seo_description ? String(row.seo_description) : undefined,
    ratingAvg: Number(row.rating_avg ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
  };
}

export function mapVariantRow(row: Row, organizationId: string) {
  return {
    id: String(row.id),
    organizationId,
    productId: String(row.product_id),
    name: String(row.name),
    sku: String(row.sku),
    price: Number(row.price),
    compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : undefined,
    stock: Number(row.stock ?? 0),
    weightGrams: row.weight_grams != null ? Number(row.weight_grams) : undefined,
    status: row.status as "active" | "archived",
  };
}

export function mapShippingMethodRow(row: Row, organizationId: string) {
  return {
    id: String(row.id),
    organizationId,
    code: String(row.code),
    name: String(row.name),
    baseRate: Number(row.base_rate ?? 0),
    freeAbove: row.free_above != null ? Number(row.free_above) : undefined,
    isActive: Boolean(row.is_active ?? true),
  };
}

export function mapPromotionRow(row: Row, organizationId: string) {
  return {
    id: String(row.id),
    organizationId,
    code: String(row.code),
    type: row.type as "percentage" | "fixed",
    value: Number(row.value),
    minCartTotal: row.min_cart_total != null ? Number(row.min_cart_total) : undefined,
    maxDiscount: row.max_discount != null ? Number(row.max_discount) : undefined,
    usageLimit: row.usage_limit != null ? Number(row.usage_limit) : undefined,
    usageCount: Number(row.usage_count ?? 0),
    isActive: Boolean(row.is_active ?? true),
    stackable: Boolean(row.stackable ?? false),
  };
}

export function mapCustomerRow(row: Row, organizationId: string) {
  return {
    id: String(row.id),
    organizationId,
    userId: String(row.user_id),
    email: row.email ? String(row.email) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    marketingOptIn: Boolean(row.marketing_opt_in ?? false),
  };
}

export function mapAddressRow(row: Row, organizationId: string) {
  return {
    id: String(row.id),
    organizationId,
    customerId: String(row.customer_id),
    label: row.label ? String(row.label) : undefined,
    name: String(row.name),
    phone: String(row.phone),
    line1: String(row.line1),
    line2: row.line2 ? String(row.line2) : undefined,
    city: String(row.city),
    state: String(row.state),
    pincode: String(row.pincode),
    isDefault: Boolean(row.is_default ?? false),
  };
}

export function mapCartRow(row: Row, organizationId: string, lines: CommerceStore["carts"][0]["lines"]) {
  return {
    id: String(row.id),
    organizationId,
    customerId: row.customer_id ? String(row.customer_id) : undefined,
    guestToken: row.guest_token ? String(row.guest_token) : undefined,
    currency: String(row.currency ?? "INR"),
    lines,
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export function mapOrderRow(
  row: Row,
  organizationId: string,
  lines: CommerceStore["orders"][0]["lines"],
  events: CommerceStore["orders"][0]["events"]
) {
  return {
    id: String(row.id),
    organizationId,
    customerId: row.customer_id ? String(row.customer_id) : undefined,
    orderNumber: String(row.order_number),
    status: row.status as CommerceStore["orders"][0]["status"],
    paymentStatus: row.payment_status as CommerceStore["orders"][0]["paymentStatus"],
    fulfilmentStatus: row.fulfilment_status as CommerceStore["orders"][0]["fulfilmentStatus"],
    subtotal: Number(row.subtotal),
    discountTotal: Number(row.discount_total ?? 0),
    shippingTotal: Number(row.shipping_total ?? 0),
    taxTotal: Number(row.tax_total ?? 0),
    grandTotal: Number(row.grand_total),
    currency: String(row.currency ?? "INR"),
    shippingMethodCode: row.shipping_method_code ? String(row.shipping_method_code) : undefined,
    promotionCode: row.promotion_code ? String(row.promotion_code) : undefined,
    guestEmail: row.guest_email ? String(row.guest_email) : undefined,
    lines,
    events,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}
