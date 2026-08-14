import type {
  Address,
  Cart,
  CustomerProfile,
  Order,
  Product,
  ProductMedia,
  ProductVariant,
  Promotion,
  Review,
  ShippingMethod,
  SupportTicket,
} from "./types";

export type CommerceStore = {
  products: Product[];
  variants: ProductVariant[];
  media: ProductMedia[];
  carts: Cart[];
  orders: Order[];
  customers: CustomerProfile[];
  addresses: Address[];
  shippingMethods: ShippingMethod[];
  promotions: Promotion[];
  reviews: Review[];
  wishlists: { customerId: string; variantId: string }[];
  productViews: { customerId?: string; productId: string; viewedAt: string }[];
  tickets: SupportTicket[];
  taxRatePercent: number;
};

export type CommerceRepository = {
  getStore(): CommerceStore;
  saveStore(store: CommerceStore): void;
  nextId(prefix: string): string;
  nextOrderNumber(orgId: string): string;
};
