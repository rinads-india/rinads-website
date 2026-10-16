"use server";

import { revalidatePath } from "next/cache";
import {
  assertJewelleryWrite,
  getJewelleryWriteContext,
} from "@/lib/jewellery-os";

const METALS = new Set(["gold", "silver", "platinum", "palladium", "other"]);
const MAKING_TYPES = new Set(["fixed", "per_gram", "percentage"]);
const APPOINTMENT_STATUSES = new Set(["scheduled", "confirmed", "completed", "cancelled", "no_show"]);
const OLD_GOLD_STATUSES = new Set(["draft", "approved", "cancelled"]);
const JOB_STATUSES = new Set(["draft", "issued", "in_progress", "received", "closed", "cancelled"]);

function text(formData: FormData, key: string, required = true): string | null {
  const value = String(formData.get(key) ?? "").trim();
  if (!value && required) throw new Error(`${key} is required.`);
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

function choice(value: string, allowed: Set<string>, field: string): string {
  if (!allowed.has(value)) throw new Error(`Invalid ${field}.`);
  return value;
}

function refresh(): void {
  revalidatePath("/os/jewellery");
}

export async function setJewelleryMetalRate(formData: FormData): Promise<void> {
  const { db, organizationId } = await getJewelleryWriteContext();
  const metalType = choice(String(text(formData, "metal_type")), METALS, "metal type");
  const purity = String(text(formData, "purity"));
  const buyRate = numberValue(formData, "buy_rate_per_gram");
  const sellRate = numberValue(formData, "sell_rate_per_gram");

  assertJewelleryWrite(
    await db.from("jewellery_metal_rates").insert({
      organization_id: organizationId,
      metal_type: metalType,
      purity,
      buy_rate_per_gram: buyRate,
      sell_rate_per_gram: sellRate,
      source: text(formData, "source", false),
      effective_at: new Date().toISOString(),
      is_active: true,
    }),
    "Save jewellery metal rate"
  );
  refresh();
}

export async function saveJewellerySkuProfile(formData: FormData): Promise<void> {
  const { db, organizationId } = await getJewelleryWriteContext();
  const productId = String(text(formData, "product_id"));
  const variantId = String(text(formData, "variant_id"));
  const grossWeight = numberValue(formData, "gross_weight_grams");
  const netWeight = numberValue(formData, "net_metal_weight_grams");
  const wastagePercent = numberValue(formData, "wastage_percent", 0);

  if (grossWeight < netWeight) throw new Error("Gross weight cannot be below net metal weight.");
  if (wastagePercent > 100) throw new Error("Wastage percent cannot exceed 100.");

  assertJewelleryWrite(
    await db.from("jewellery_item_profiles").upsert(
      {
        organization_id: organizationId,
        product_id: productId,
        variant_id: variantId,
        tag_number: String(text(formData, "tag_number")),
        design_number: text(formData, "design_number", false),
        metal_type: choice(String(text(formData, "metal_type")), METALS, "metal type"),
        purity: String(text(formData, "purity")),
        gross_weight_grams: grossWeight,
        net_metal_weight_grams: netWeight,
        stone_weight_carat: numberValue(formData, "stone_weight_carat", 0),
        stone_value: numberValue(formData, "stone_value", 0),
        making_charge_type: choice(
          String(text(formData, "making_charge_type", false) ?? "fixed"),
          MAKING_TYPES,
          "making charge type"
        ),
        making_charge_value: numberValue(formData, "making_charge_value", 0),
        wastage_percent: wastagePercent,
        huid: text(formData, "huid", false),
        hallmark_number: text(formData, "hallmark_number", false),
        certification_number: text(formData, "certification_number", false),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id,variant_id" }
    ),
    "Save jewellery SKU profile"
  );
  refresh();
}

export async function createJewelleryAppointment(formData: FormData): Promise<void> {
  const { db, organizationId } = await getJewelleryWriteContext();
  const scheduledRaw = String(text(formData, "scheduled_at"));
  const scheduledAt = new Date(scheduledRaw);
  if (Number.isNaN(scheduledAt.getTime())) throw new Error("A valid appointment time is required.");

  const guestName = text(formData, "guest_name", false);
  const guestPhone = text(formData, "guest_phone", false);
  const guestEmail = text(formData, "guest_email", false);
  if (!guestName && !guestPhone && !guestEmail) {
    throw new Error("Provide at least a customer name, phone, or email.");
  }

  assertJewelleryWrite(
    await db.from("jewellery_appointments").insert({
      organization_id: organizationId,
      guest_name: guestName,
      guest_phone: guestPhone,
      guest_email: guestEmail,
      purpose: text(formData, "purpose", false) ?? "showroom_visit",
      scheduled_at: scheduledAt.toISOString(),
      status: "scheduled",
      notes: text(formData, "notes", false),
    }),
    "Create jewellery appointment"
  );
  refresh();
}

export async function setJewelleryAppointmentStatus(formData: FormData): Promise<void> {
  const { db, organizationId } = await getJewelleryWriteContext();
  const id = String(text(formData, "id"));
  const status = choice(String(text(formData, "status")), APPOINTMENT_STATUSES, "appointment status");

  assertJewelleryWrite(
    await db.from("jewellery_appointments").update({
      status,
      updated_at: new Date().toISOString(),
    }).eq("organization_id", organizationId).eq("id", id),
    "Update jewellery appointment"
  );
  refresh();
}

export async function createOldGoldExchange(formData: FormData): Promise<void> {
  const { db, organizationId } = await getJewelleryWriteContext();
  const grossWeight = numberValue(formData, "gross_weight_grams");
  const netWeight = numberValue(formData, "net_weight_grams");
  const rate = numberValue(formData, "rate_per_gram");
  const deduction = numberValue(formData, "deduction_value", 0);

  if (grossWeight <= 0 || grossWeight < netWeight) {
    throw new Error("Gross weight must be greater than zero and at least the net weight.");
  }

  const grossValue = Math.round(netWeight * rate * 100) / 100;
  if (deduction > grossValue) throw new Error("Deduction cannot exceed the assessed value.");
  const netCreditValue = Math.round((grossValue - deduction) * 100) / 100;

  assertJewelleryWrite(
    await db.from("jewellery_old_gold_exchanges").insert({
      organization_id: organizationId,
      reference_number: String(text(formData, "reference_number")),
      gross_weight_grams: grossWeight,
      net_weight_grams: netWeight,
      assessed_purity: String(text(formData, "assessed_purity")),
      rate_per_gram: rate,
      gross_value: grossValue,
      deduction_value: deduction,
      net_credit_value: netCreditValue,
      status: "draft",
      notes: text(formData, "notes", false),
    }),
    "Create old-gold assessment"
  );
  refresh();
}

export async function setOldGoldStatus(formData: FormData): Promise<void> {
  const { db, organizationId } = await getJewelleryWriteContext();
  const id = String(text(formData, "id"));
  const status = choice(String(text(formData, "status")), OLD_GOLD_STATUSES, "old-gold status");
  const now = new Date().toISOString();

  assertJewelleryWrite(
    await db.from("jewellery_old_gold_exchanges").update({
      status,
      approved_at: status === "approved" ? now : null,
      updated_at: now,
    }).eq("organization_id", organizationId).eq("id", id),
    "Update old-gold assessment"
  );
  refresh();
}

export async function createJewelleryJobOrder(formData: FormData): Promise<void> {
  const { db, organizationId } = await getJewelleryWriteContext();
  const issuedWeight = numberValue(formData, "issued_weight_grams", 0);
  const dueRaw = text(formData, "due_at", false);
  const dueAt = dueRaw ? new Date(dueRaw) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) throw new Error("A valid due date is required.");

  assertJewelleryWrite(
    await db.from("jewellery_job_orders").insert({
      organization_id: organizationId,
      job_number: String(text(formData, "job_number")),
      description: text(formData, "description", false),
      metal_type: choice(String(text(formData, "metal_type")), METALS, "metal type"),
      purity: String(text(formData, "purity")),
      issued_weight_grams: issuedWeight,
      received_weight_grams: 0,
      wastage_weight_grams: 0,
      labour_charge: numberValue(formData, "labour_charge", 0),
      status: issuedWeight > 0 ? "issued" : "draft",
      issued_at: issuedWeight > 0 ? new Date().toISOString() : null,
      due_at: dueAt?.toISOString() ?? null,
    }),
    "Create jewellery job work"
  );
  refresh();
}

export async function updateJewelleryJobOrder(formData: FormData): Promise<void> {
  const { db, organizationId } = await getJewelleryWriteContext();
  const id = String(text(formData, "id"));
  const status = choice(String(text(formData, "status")), JOB_STATUSES, "job status");
  const receivedWeight = numberValue(formData, "received_weight_grams", 0);
  const wastageWeight = numberValue(formData, "wastage_weight_grams", 0);
  const now = new Date().toISOString();

  assertJewelleryWrite(
    await db.from("jewellery_job_orders").update({
      status,
      received_weight_grams: receivedWeight,
      wastage_weight_grams: wastageWeight,
      received_at: ["received", "closed"].includes(status) ? now : null,
      updated_at: now,
    }).eq("organization_id", organizationId).eq("id", id),
    "Update jewellery job work"
  );
  refresh();
}
