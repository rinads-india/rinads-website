"use server";

import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";

/**
 * Create an organization for the signed-in user (becomes admin).
 * Requires Supabase Auth mode + applied CORE migration.
 */
export async function createOrganizationAction(input: {
  name: string;
  slug: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseMode()) {
    return { ok: false, error: "Supabase Auth is not enabled" };
  }

  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!name || !slug) {
    return { ok: false, error: "Name and slug are required" };
  }

  try {
    const supabase = await createWebsiteServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return { ok: false, error: "Not authenticated" };
    }

    // Untyped until `supabase gen types` from a linked project.
    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: string,
          args: { p_name: string; p_slug: string }
        ) => Promise<{ data: unknown; error: { message: string } | null }>;
      }
    ).rpc("create_organization", { p_name: name, p_slug: slug });

    if (error) {
      return { ok: false, error: error.message };
    }

    const org = data as { id?: string } | null;
    if (!org?.id) {
      return { ok: false, error: "Organization was not returned" };
    }

    return { ok: true, id: org.id };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected error",
    };
  }
}
