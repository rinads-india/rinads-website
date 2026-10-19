import "server-only";

import { requireOsShellAccess } from "@/lib/os-shell-access";
import { createWebsiteServerClient } from "@/lib/supabase/server";

export type DbError = { message: string; code?: string };
export type DbResult<T> = { data: T | null; error: DbError | null };

type OrderOptions = {
  ascending?: boolean;
  nullsFirst?: boolean;
  referencedTable?: string;
};

type UpsertOptions = {
  onConflict?: string;
  ignoreDuplicates?: boolean;
};

export interface JewelleryQuery<Row extends object> extends PromiseLike<DbResult<Row[]>> {
  select(columns?: string): JewelleryQuery<Row>;
  eq(column: string, value: unknown): JewelleryQuery<Row>;
  neq(column: string, value: unknown): JewelleryQuery<Row>;
  gte(column: string, value: unknown): JewelleryQuery<Row>;
  in(column: string, values: readonly unknown[]): JewelleryQuery<Row>;
  order(column: string, options?: OrderOptions): JewelleryQuery<Row>;
  limit(count: number): JewelleryQuery<Row>;
  insert(values: Record<string, unknown> | readonly Record<string, unknown>[]): JewelleryQuery<Row>;
  update(values: Record<string, unknown>): JewelleryQuery<Row>;
  upsert(
    values: Record<string, unknown> | readonly Record<string, unknown>[],
    options?: UpsertOptions
  ): JewelleryQuery<Row>;
}

export type JewelleryDb = {
  from<Row extends object = Record<string, unknown>>(table: string): JewelleryQuery<Row>;
};

function asJewelleryDb(client: unknown): JewelleryDb {
  return client as JewelleryDb;
}

function rows<T>(result: DbResult<T[]>, operation: string): T[] {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`);
  return result.data ?? [];
}

export function assertJewelleryWrite(result: DbResult<unknown>, operation: string): void {
  if (result.error) throw new Error(`${operation}: ${result.error.message}`);
}

export type JewelleryMetalRate = {
  id: string;
  metal_type: string;
  purity: string;
  buy_rate_per_gram: number;
  sell_rate_per_gram: number;
  source: string | null;
  effective_at: string;
};

export type JewellerySku = {
  productId: string;
  variantId: string;
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

export type JewelleryOldGold = {
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

export type JewelleryOsData = {
  live: boolean;
  organizationId: string | null;
  rates: JewelleryMetalRate[];
  skus: JewellerySku[];
  appointments: JewelleryAppointment[];
  oldGold: JewelleryOldGold[];
  jobOrders: JewelleryJobOrder[];
  metrics: {
    catalogVariants: number;
    profiledSkus: number;
    missingProfiles: number;
    upcomingAppointments: number;
    openOldGold: number;
    activeJobWork: number;
  };
};

type ProductRow = { id: string; name: string; status: string };
type VariantRow = {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price: number;
  status: string;
};
type ProfileRow = {
  product_id: string;
  variant_id: string;
  tag_number: string;
  design_number: string | null;
  metal_type: string;
  purity: string;
  gross_weight_grams: number;
  net_metal_weight_grams: number;
  huid: string | null;
};

const EMPTY: JewelleryOsData = {
  live: false,
  organizationId: null,
  rates: [],
  skus: [],
  appointments: [],
  oldGold: [],
  jobOrders: [],
  metrics: {
    catalogVariants: 0,
    profiledSkus: 0,
    missingProfiles: 0,
    upcomingAppointments: 0,
    openOldGold: 0,
    activeJobWork: 0,
  },
};

export async function getJewelleryWriteContext() {
  const access = await requireOsShellAccess("/os/jewellery");
  if (!access.enforced || !access.organizationId) {
    throw new Error("Jewellery OS writes require an authenticated live organization.");
  }

  const supabase = await createWebsiteServerClient();
  return {
    db: asJewelleryDb(supabase),
    organizationId: access.organizationId,
  };
}

export async function loadJewelleryOsData(): Promise<JewelleryOsData> {
  const access = await requireOsShellAccess("/os/jewellery");
  if (!access.enforced || !access.organizationId) return EMPTY;

  const supabase = await createWebsiteServerClient();
  const db = asJewelleryDb(supabase);
  const organizationId = access.organizationId;
  const now = new Date().toISOString();

  const [productResult, variantResult, profileResult, rateResult, appointmentResult, oldGoldResult, jobResult] =
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
        .limit(2500),
      db.from<ProfileRow>("jewellery_item_profiles")
        .select("product_id,variant_id,tag_number,design_number,metal_type,purity,gross_weight_grams,net_metal_weight_grams,huid")
        .eq("organization_id", organizationId)
        .limit(2500),
      db.from<JewelleryMetalRate>("jewellery_metal_rates")
        .select("id,metal_type,purity,buy_rate_per_gram,sell_rate_per_gram,source,effective_at")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("effective_at", { ascending: false })
        .limit(24),
      db.from<JewelleryAppointment>("jewellery_appointments")
        .select("id,guest_name,guest_phone,purpose,scheduled_at,status")
        .eq("organization_id", organizationId)
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(24),
      db.from<JewelleryOldGold>("jewellery_old_gold_exchanges")
        .select("id,reference_number,assessed_purity,net_weight_grams,net_credit_value,status,created_at")
        .eq("organization_id", organizationId)
        .in("status", ["draft", "approved"])
        .order("created_at", { ascending: false })
        .limit(24),
      db.from<JewelleryJobOrder>("jewellery_job_orders")
        .select("id,job_number,description,purity,issued_weight_grams,received_weight_grams,labour_charge,status,due_at")
        .eq("organization_id", organizationId)
        .in("status", ["draft", "issued", "in_progress", "received"])
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(24),
    ]);

  const products = rows(productResult, "Load jewellery products");
  const variants = rows(variantResult, "Load jewellery variants");
  const profiles = rows(profileResult, "Load jewellery profiles");
  const rates = rows(rateResult, "Load metal rates");
  const appointments = rows(appointmentResult, "Load appointments");
  const oldGold = rows(oldGoldResult, "Load old-gold exchanges");
  const jobOrders = rows(jobResult, "Load job work");

  const productNames = new Map(products.map((product) => [product.id, product.name]));
  const profileByVariant = new Map(profiles.map((profile) => [profile.variant_id, profile]));
  const skus: JewellerySku[] = variants.map((variant) => {
    const profile = profileByVariant.get(variant.id);
    return {
      productId: variant.product_id,
      variantId: variant.id,
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
    live: true,
    organizationId,
    rates,
    skus,
    appointments,
    oldGold,
    jobOrders,
    metrics: {
      catalogVariants: variants.length,
      profiledSkus: profiles.length,
      missingProfiles: Math.max(variants.length - profiles.length, 0),
      upcomingAppointments: appointments.filter((entry) => ["scheduled", "confirmed"].includes(entry.status)).length,
      openOldGold: oldGold.length,
      activeJobWork: jobOrders.length,
    },
  };
}
