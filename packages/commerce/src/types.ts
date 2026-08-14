export type ProductStatus = "draft" | "published" | "archived";
export type OrderStatus =
  | "placed"
  | "confirmed"
  | "payment_failed"
  | "cancelled"
  | "return_requested"
  | "returned"
  | "refund_pending"
  | "refunded"
  | "delivery_failed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type FulfilmentStatus =
  | "unfulfilled"
  | "packed"
  | "shipped"
  | "out_for_delivery"
  | "delivered";
export type TicketStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "waiting_customer"
  | "resolved"
  | "closed";

export type Product = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string;
  status: ProductStatus;
  categorySlug: string;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  ratingAvg: number;
  ratingCount: number;
};

export type ProductVariant = {
  id: string;
  organizationId: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  weightGrams?: number;
  status: "active" | "archived";
};

export type ProductMedia = {
  id: string;
  productId: string;
  variantId?: string;
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
};

export type CartLine = {
  id: string;
  variantId: string;
  quantity: number;
};

export type Cart = {
  id: string;
  organizationId: string;
  customerId?: string;
  guestToken?: string;
  currency: string;
  lines: CartLine[];
  updatedAt: string;
};

export type Address = {
  id: string;
  organizationId: string;
  customerId: string;
  label?: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export type CustomerProfile = {
  id: string;
  organizationId: string;
  userId: string;
  email?: string;
  phone?: string;
  marketingOptIn: boolean;
};

export type ShippingMethod = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  baseRate: number;
  freeAbove?: number;
  isActive: boolean;
};

export type Promotion = {
  id: string;
  organizationId: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minCartTotal?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  stackable: boolean;
};

export type OrderLineSnapshot = {
  id: string;
  variantId?: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  discountAmount: number;
  imageUrl?: string;
};

export type OrderEvent = {
  id: string;
  eventType: string;
  label: string;
  occurredAt: string;
};

export type Order = {
  id: string;
  organizationId: string;
  customerId?: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  fulfilmentStatus: FulfilmentStatus;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  grandTotal: number;
  currency: string;
  shippingMethodCode?: string;
  promotionCode?: string;
  guestEmail?: string;
  lines: OrderLineSnapshot[];
  events: OrderEvent[];
  createdAt: string;
};

export type CheckoutInput = {
  cartId: string;
  customerId?: string;
  guestEmail?: string;
  addressId?: string;
  shippingMethodCode: string;
  promotionCode?: string;
  paymentProvider: string;
  paymentReference?: string;
};

export type CommerceContext = {
  organizationId: string;
  userId?: string;
  customerId?: string;
  requestId?: string;
};

export type SearchSort =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "rating"
  | "popular";

export type SearchFilters = {
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  tags?: string[];
};

export type ProductCard = Product & {
  primaryImageUrl?: string;
  minPrice: number;
  maxPrice: number;
  inStock: boolean;
  variants: ProductVariant[];
};

export type Review = {
  id: string;
  productId: string;
  customerId: string;
  orderId?: string;
  rating: number;
  body?: string;
  moderationStatus: "pending" | "approved" | "rejected" | "flagged";
};

export type SupportTicket = {
  id: string;
  organizationId: string;
  customerId: string;
  orderId?: string;
  category: string;
  priority: string;
  status: TicketStatus;
  subject: string;
  messages: { id: string; authorType: string; body: string; createdAt: string }[];
  createdAt: string;
};

export type ApiError = {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
  requestId?: string;
};

export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };
