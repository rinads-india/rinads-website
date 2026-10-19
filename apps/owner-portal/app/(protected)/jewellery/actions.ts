"use server";

import { revalidatePath } from "next/cache";
import { createOwnerServerClient } from "../../../lib/supabase/server";
import { getCommerceContextFromTenancy, isDemoMode } from "../../../lib/tenancy";
import { asJewelleryDb, assertDbWrite } from "../../../lib/jewellery-db";

const METALS = new Set(["gold", "silver", "platinum", "palladium", "other"]);
const MAKING_TYPES = new Set(["fixed", "per_gram", "percentage"]);

function text(formData: FormData, key: string, required = true): string | null {
  const value = String(formData.get(key) ?? "").trim();
  if (!value && required) {
    throw new Error(`${key} is required.`);
  }
  return value || null;
}

function numberValue(formData: FormData, key: string, fallback?: number): number {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw && fallback !== undefined) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${key} must be a finite non-negative number.`);
  }
  return value;
}

function assertChoice(value: string, choices: Set<string>, field: string): string {
  if (!choices.has(value)) {
    throw new Error(`Invalid ${field}.`);
  }
  return value;
}

async function liveDbContext() {
  if (isDemoMode()) {
    throw new Error("Jewellery write actions require a live Supabase tenant.");
  }
  const supabase = await createOwnerServerClient();
  const ctx = await getCommerceContextFromTenancy(async () => supabase);
  return { db: asJewelleryDb(supabase), ctx };
}

function refreshJewellery(): void {
  revalidatePath("/jewellery");
}

export async function setMetalRate(formData: FormData): Promise<void> {
  const { db, ctx } = await liveDbContext();
  const metalType = assertChoice(String(text(formData, "metal_type")), METALS, "metal type");
  const purity = String(text(formData, "purity"));
  const buyRate = numberValue(formData, "buy_rate_per_gram");
  const sellRate = numberValue(formData, "sell_rate_per_gram");
  const source = text(formData, "source", false);

  const result = await db.from("jewellery_metal_rates").insert({
    organization_id: ctx.organizationId,
    metal_type: metalType,
    purity,
    buy_rate_per_gram: buyRate,
    sell_rate_per_gram: sellRate,
    source,
    effective_at: new Date().toISOString(),
    is_active: true,
  });

  assertDbWrite(result, "Save metal rate");
  refreshJewellery();
}

export async function saveJewelleryItemProfile(formData: FormData): Promise<void> {
  const { db, ctx } = await liveDbContext();
  const productId = String(text(formData, "product_id"));
  const variantId = String(text(formData, "variant_id"));
  const tagNumber = String(text(formData, "tag_number"));
  const metalType = assertChoice(String(text(formData, "metal_type")), METALS, "metal type");
  const purity = String(text(formData, "purity"));
  const grossWeight = numberValue(formData, "gross_weight_grams");
  const netWeight = numberValue(formData, "net_metal_weight_grams");
  const stoneWeight = numberValue(formData, "stone_weight_carat", 0);
  const stoneValue = numberValue(formData, "stone_value", 0);
  const makingType = assertChoice(
    String(text(formData, "making_charge_type", false) ?? "fixed"),
    MAKING_TYPES,
    "making charge type"
  );
  const makingValue = numberValue(formData, "making_charge_value", 0);
  const wastagePercent = numberValue(formData, "wastage_percent", 0);

  if (grossWeight < netWeight) {
    throw new Error("gross_weight_grams cannot be lower than net_metal_weight_grams.");
  }
  if (wastagePercent > 100) {
    throw new Error("wastage_percent cannot exceed 100.");
  }

  const result = await db.from("jewellery_item_profiles").upsert(
    {
      organization_id: ctx.organizationId,
      product_id: productId,
      variant_id: variantId,
      tag_number: tagNumber,
      design_number: text(formData, "design_number", false),
      metal_type: metalType,
      purity,
      gross_weight_grams: grossWeight,
      net_metal_weight_grams: netWeight,
      stone_weight_carat: stoneWeight,
      stone_value: stoneValue,
      making_charge_type: makingType,
      making_charge_value: makingValue,
      wastage_percent: wastagePercent,
      huid: text(formData, "huid", false),
      hallmark_number: text(formData, "hallmark_number", false),
      certification_number: text(formData, "certification_number", false),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "organization_id,variant_id" }
  );

  assertDbWrite(result, "Save jewellery item profile");
  refreshJewellery();
}

export async function createJewelleryAppointment(formData: FormData): Promise<void> {
  const { db, ctx } = await liveDbContext();
  const scheduledInput = String(text(formData, "scheduled_at"));
  const scheduledAt = new Date(scheduledInput);
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("scheduled_at must be a valid date and time.");
  }

  const guestName = text(formData, "guest_name", false);
  const guestPhone = text(formData, "guest_phone", false);
  const guestEmail = text(formData, "guest_email", false);
  if (!guestName && !guestPhone && !guestEmail) {
    throw new Error("Provide at least a guest name, phone, or email.");
  }

  const result = await db.from("jewellery_appointments").insert({
    organization_id: ctx.organizationId,
    guest_name: guestName,
    guest_phone: guestPhone,
    guest_email: guestEmail,
    purpose: text(formData, "purpose", false) ?? "showroom_visit",
    scheduled_at: scheduledAt.toISOString(),
    status: "scheduled",
    notes: text(formData, "notes", false),
  });

  assertDbWrite(result, "Create jewellery appointment");
  refreshJewellery();
}

export async function createOldGoldExchange(formData: FormData): Promise<void> {
  const { db, ctx } = await liveDbContext();
  const grossWeight = numberValue(formData, "gross_weight_grams");
  const netWeight = numberValue(formData, "net_weight_grams");
  const rate = numberValue(formData, "rate_per_gram");
  const deduction = numberValue(formData, "deduction_value", 0);
  if (grossWeight <= 0 || grossWeight < netWeight) {
    throw new Error("Old-gold gross weight must be greater than zero and at least the net weight.");
  }

  const grossValue = Math.round(netWeight * rate * 100) / 100;
  if (deduction > grossValue) {
    throw new Error("deduction_value cannot exceed the assessed gross value.");
  }

  const result = await db.from("jewellery_old_gold_exchanges").insert({
    organization_id: ctx.organizationId,
    reference_number: String(text(formData, "reference_number")),
    gross_weight_grams: grossWeight,
    net_weight_grams: netWeight,
    assessed_purity: String(text(formData, "assessed_purity")),
    rate_per_gram: rate,
    gross_value: grossValue,
    deduction_value: deduction,
    net_credit_value: Math.round((grossValue - deduction) * 100) / 100,
    status: "draft",
    notes: text(formData, "notes", false),
  });

  assertDbWrite(result, "Create old-gold exchange");
  refreshJewellery();
}

export async function createJewelleryJobOrder(formData: FormData): Promise<void> {
  const { db, ctx } = await liveDbContext();
  const issuedWeight = numberValue(formData, "issued_weight_grams", 0);
  const dueAtRaw = text(formData, "due_at", false);
  const dueAt = dueAtRaw ? new Date(dueAtRaw) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) {
    throw new Error("due_at must be a valid date and time.");
  }

  const result = await db.from("jewellery_job_orders").insert({
    organization_id: ctx.organizationId,
    job_number: String(text(formData, "job_number")),
    description: text(formData, "description", false),
    metal_type: assertChoice(String(text(formData, "metal_type")), METALS, "metal type"),
    purity: String(text(formData, "purity")),
    issued_weight_grams: issuedWeight,
    received_weight_grams: 0,
    wastage_weight_grams: 0,
    labour_charge: numberValue(formData, "labour_charge", 0),
    status: issuedWeight > 0 ? "issued" : "draft",
    issued_at: issuedWeight > 0 ? new Date().toISOString() : null,
    due_at: dueAt?.toISOString() ?? null,
  });

  assertDbWrite(result, "Create jewellery job order");
  refreshJewellery();
}
