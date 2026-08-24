export type ServicePillar = "build" | "grow" | "automate" | "transform";

export type ServiceCatalogItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  pillar: ServicePillar;
  pricingModel: string;
  basePrice: number | null;
  currency: string;
  estimatedDeliveryDays: number | null;
};

export type PublicOrderStatus = {
  orderId: string;
  orderNumber: string;
  serviceName: string;
  pillar: string;
  status: string;
  progressPct: number;
  createdAt: string;
  dueDate: string | null;
  updatedAt: string;
};

export const ORDER_STATUS_PROGRESS: Record<string, number> = {
  pending: 5,
  paid: 15,
  assigned: 25,
  in_progress: 50,
  qa: 70,
  revision: 65,
  client_review: 85,
  delivered: 100,
  cancelled: 0,
};

export function formatServicePrice(item: Pick<ServiceCatalogItem, "pricingModel" | "basePrice" | "currency">): string {
  if (item.pricingModel === "quote" || item.basePrice == null) {
    return "Custom quote";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: item.currency || "INR",
    maximumFractionDigits: 0,
  }).format(item.basePrice);
}
