"use server";

import { revalidatePath } from "next/cache";
import { requirePlanModule } from "@rinads/tenancy";
import { resolveLiveOsTenant } from "@/lib/os-tenant-live";

type InsertClient = {
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
};

function cleanOptional(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function requireWritableEntitlement(entitlementState: string | undefined): void {
  if (
    entitlementState === "none" ||
    entitlementState === "expired_read_only" ||
    !entitlementState
  ) {
    throw new Error("This RI ID workspace is read-only until a paid or governed trial entitlement is active.");
  }
}

export async function createLiveCustomerAction(formData: FormData): Promise<void> {
  const fullName = cleanOptional(formData.get("fullName"));
  if (!fullName || fullName.length > 160) {
    throw new Error("Customer name is required and must be 160 characters or fewer.");
  }

  const { supabase, tenancy } = await resolveLiveOsTenant();
  if (!tenancy) throw new Error("Active RI ID organization is required.");
  requireWritableEntitlement(tenancy.entitlementState);
  const moduleAccess = requirePlanModule(tenancy, "crm");
  if (!moduleAccess.allowed) throw new Error(moduleAccess.reason);

  const { error } = await (supabase as unknown as InsertClient)
    .from("cos_contacts")
    .insert({
      organization_id: tenancy.organizationId,
      full_name: fullName,
      email: cleanOptional(formData.get("email")),
      phone: cleanOptional(formData.get("phone")),
      title: cleanOptional(formData.get("title")),
      is_primary: false,
    });

  if (error) throw new Error(error.message);
  revalidatePath("/os/customers");
}

export async function createLiveTaskAction(formData: FormData): Promise<void> {
  const title = cleanOptional(formData.get("title"));
  if (!title || title.length > 240) {
    throw new Error("Task title is required and must be 240 characters or fewer.");
  }

  const priority = cleanOptional(formData.get("priority")) ?? "normal";
  if (!["low", "normal", "high", "critical"].includes(priority)) {
    throw new Error("Invalid task priority.");
  }

  const { supabase, tenancy } = await resolveLiveOsTenant();
  if (!tenancy) throw new Error("Active RI ID organization is required.");
  requireWritableEntitlement(tenancy.entitlementState);
  const moduleAccess = requirePlanModule(tenancy, "tasks");
  if (!moduleAccess.allowed) throw new Error(moduleAccess.reason);

  const dueDate = cleanOptional(formData.get("dueDate"));
  const dueAt = dueDate ? new Date(`${dueDate}T17:00:00+05:30`).toISOString() : null;

  const { error } = await (supabase as unknown as InsertClient)
    .from("cos_tasks")
    .insert({
      organization_id: tenancy.organizationId,
      title,
      status: "todo",
      priority,
      due_at: dueAt,
      ai_involved: false,
    });

  if (error) throw new Error(error.message);
  revalidatePath("/os/work");
}
