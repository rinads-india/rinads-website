import "server-only";

import { cookies } from "next/headers";
import {
  ACTIVE_ORG_COOKIE,
  resolveTenancyFromSupabase,
  type TenancyContext,
  type TenancySupabaseClient,
} from "@rinads/tenancy";
import { createWebsiteServerClient } from "@/lib/supabase/server";

export type LiveCustomer = {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  title?: string;
  createdAt: string;
};

export type LiveTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt?: string;
  createdAt: string;
};

type QueryResult = {
  data: Record<string, unknown>[] | null;
  error: { message: string } | null;
};

type LiveDataClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (
          column: string,
          options: { ascending: boolean },
        ) => Promise<QueryResult>;
      };
    };
  };
};

export async function resolveLiveOsTenant(): Promise<{
  supabase: Awaited<ReturnType<typeof createWebsiteServerClient>>;
  tenancy: TenancyContext | null;
}> {
  const supabase = await createWebsiteServerClient();
  const cookieStore = await cookies();
  const activeOrgCookie = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const tenancy = await resolveTenancyFromSupabase(
    supabase as unknown as TenancySupabaseClient,
    activeOrgCookie,
  );
  return { supabase, tenancy };
}

export async function loadLiveCustomers(
  client: unknown,
  organizationId: string,
): Promise<{ data: LiveCustomer[]; error?: string }> {
  const { data, error } = await (client as LiveDataClient)
    .from("cos_contacts")
    .select("id, full_name, email, phone, title, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return {
    data: (data ?? []).map((row) => ({
      id: String(row.id),
      fullName: String(row.full_name ?? "Unnamed customer"),
      email: row.email ? String(row.email) : undefined,
      phone: row.phone ? String(row.phone) : undefined,
      title: row.title ? String(row.title) : undefined,
      createdAt: String(row.created_at ?? ""),
    })),
  };
}

export async function loadLiveTasks(
  client: unknown,
  organizationId: string,
): Promise<{ data: LiveTask[]; error?: string }> {
  const { data, error } = await (client as LiveDataClient)
    .from("cos_tasks")
    .select("id, title, status, priority, due_at, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) return { data: [], error: error.message };
  return {
    data: (data ?? []).map((row) => ({
      id: String(row.id),
      title: String(row.title ?? "Untitled task"),
      status: String(row.status ?? "todo"),
      priority: String(row.priority ?? "normal"),
      dueAt: row.due_at ? String(row.due_at) : undefined,
      createdAt: String(row.created_at ?? ""),
    })),
  };
}
