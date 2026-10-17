import "server-only";
import { createOwnerServerClient } from "./supabase/server";
import { getCommerceContextFromTenancy, isDemoMode } from "./tenancy";
import { asJewelleryDb, assertDbResult } from "./jewellery-db";

export type JewelleryMetalRate = {
  id: string;
  metal_type: string;
  purity: string;
  buy_rate_per_gram: number;
  sell_rate_per_gram: number;
  source: string | null;
  effective_at: string;
};

export type JewelleryItem = {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  price: number;
  tagNumber: string | null;
  designNumber: string | null;
  metalType: string | null;
  purity: string | null;
  grossWeightGrams: number | null;
  netMetalWeightGrams: number | null;
  huid: string | null;
};

export type JewelleryAppointment = {
  id: string;
  guest_name: string | null;
  guest_phone: string | null;
  purpose: string;
  scheduled_at: string;
  status: string;
};

export type JewelleryOldGoldExchange = {
  id: string;
  reference_number: string;
  assessed_purity: string;
  net_weight_grams: number;
  net_credit_value: number;
  status: string;
  created_at: string;
};

export type JewelleryJobOrder = {
  id: string;
  job_number: string;
  description: string | null;
  purity: string;
  issued_weight_grams: number;
  received_weight_grams: number;
  labour_charge: number;
  status: string;
  due_at: string | null;
};

export type JewelleryDashboard = {
  demo: boolean;
  organizationId: string | null;
  rates: JewelleryMetalRate[];
  items: JewelleryItem[];
  appointments: JewelleryAppointment[];
  oldGold: JewelleryOldGoldExchange[];
  jobOrders: JewelleryJobOrder[];
  metrics: {
    totalVariants: number;
    profiledSkus: number;
    missingProfiles: number;
    upcomingAppointments: number;
    activeJobWork: number;
    openOldGold: number;
  };
};

type ProductRow = {
  id: string;
  name: string;
  status: string;
};

type VariantRow = {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price: number;
  status: string;
};

type ItemProfileRow = {
  variant_id: string;
  product_id: string;
  tag_number: string;
  design_number: string | null;
  metal_type: string;
  purity: string;
  gross_weight_grams: number;
  net_metal_weight_grams: number;
  huid: string | null;
};

const EMPTY_DASHBOARD: JewelleryDashboard = {
  demo: true,
  organizationId: null,
  rates: [],
  items: [],
  appointments: [],
  oldGold: [],
  jobOrders: [],
  metrics: {
    totalVariants: 0,
    profiledSkus: 0,
    missingProfiles: 0,
    upcomingAppointments: 0,
    activeJobWork: 0,
    openOldGold: 0,
  },
};

export async function loadJewelleryDashboard(): Promise<JewelleryDashboard> {
  if (isDemoMode()) {
    return EMPTY_DASHBOARD;
  }

  const supabase = await createOwnerServerClient();
  const ctx = await getCommerceContextFromTenancy(async () => supabase);
  const db = asJewelleryDb(supabase);
  const organizationId = ctx.organizationId;
  const now = new Date().toISOString();

  const [productsResult, variantsResult, profilesResult, ratesResult, appointmentsResult, oldGoldResult, jobsResult] =
    await Promise.all([
      db.from<ProductRow>("products")
        .select("id,name,status")
        .eq("organization_id", organizationId)
        .neq("status", "archived")
        .limit(1000),
      db.from<VariantRow>("product_variants")
        .select("id,product_id,name,sku,price,status")
        .eq("organization_id", organizationId)
        .neq("status", "archived")
        .limit(2000),
      db.from<ItemProfileRow>("jewellery_item_profiles")
        .select("variant_id,product_id,tag_number,design_number,metal_type,purity,gross_weight_grams,net_metal_weight_grams,huid")
        .eq("organization_id", organizationId)
        .limit(2000),
      db.from<JewelleryMetalRate>("jewellery_metal_rates")
        .select("id,metal_type,purity,buy_rate_per_gram,sell_rate_per_gram,source,effective_at")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("effective_at", { ascending: false })
        .limit(30),
      db.from<JewelleryAppointment>("jewellery_appointments")
        .select("id,guest_name,guest_phone,purpose,scheduled_at,status")
        .eq("organization_id", organizationId)
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(30),
      db.from<JewelleryOldGoldExchange>("jewellery_old_gold_exchanges")
        .select("id,reference_number,assessed_purity,net_weight_grams,net_credit_value,status,created_at")
        .eq("organization_id", organizationId)
        .in("status", ["draft", "approved"])
        .order("created_at", { ascending: false })
        .limit(30),
      db.from<JewelleryJobOrder>("jewellery_job_orders")
        .select("id,job_number,description,purity,issued_weight_grams,received_weight_grams,labour_charge,status,due_at")
        .eq("organization_id", organizationId)
        .in("status", ["draft", "issued", "in_progress", "received"])
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(30),
    ]);

  const products = assertDbResult(productsResult, "Load jewellery products");
  const variants = assertDbResult(variantsResult, "Load jewellery variants");
  const profiles = assertDbResult(profilesResult, "Load jewellery item profiles");
  const rates = assertDbResult(ratesResult, "Load jewellery metal rates");
  const appointments = assertDbResult(appointmentsResult, "Load jewellery appointments");
  const oldGold = assertDbResult(oldGoldResult, "Load old-gold exchanges");
  const jobOrders = assertDbResult(jobsResult, "Load jewellery job work");

  const productNames = new Map(products.map((product) => [product.id, product.name]));
  const profilesByVariant = new Map(profiles.map((profile) => [profile.variant_id, profile]));

  const items: JewelleryItem[] = variants.map((variant) => {
    const profile = profilesByVariant.get(variant.id);
    return {
      variantId: variant.id,
      productId: variant.product_id,
      productName: productNames.get(variant.product_id) ?? "Unknown product",
      variantName: variant.name,
      sku: variant.sku,
      price: variant.price,
      tagNumber: profile?.tag_number ?? null,
      designNumber: profile?.design_number ?? null,
      metalType: profile?.metal_type ?? null,
      purity: profile?.purity ?? null,
      grossWeightGrams: profile?.gross_weight_grams ?? null,
      netMetalWeightGrams: profile?.net_metal_weight_grams ?? null,
      huid: profile?.huid ?? null,
    };
  });

  return {
    demo: false,
    organizationId,
    rates,
    items,
    appointments,
    oldGold,
    jobOrders,
    metrics: {
      totalVariants: variants.length,
      profiledSkus: profiles.length,
      missingProfiles: Math.max(variants.length - profiles.length, 0),
      upcomingAppointments: appointments.filter((appointment) =>
        ["scheduled", "confirmed"].includes(appointment.status)
      ).length,
      activeJobWork: jobOrders.filter((job) => !["closed", "cancelled"].includes(job.status)).length,
      openOldGold: oldGold.filter((exchange) => ["draft", "approved"].includes(exchange.status)).length,
    },
  };
}
