import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACTIVE_ORG_COOKIE,
  loadMemberships,
  type TenancySupabaseClient,
} from "@rinads/tenancy";
import { resolveRinpoPhoneHome } from "@/lib/rinpo-phone-home";
import { isSupabaseMode } from "@/lib/supabase/env";
import { createWebsiteServerClient } from "@/lib/supabase/server";

function noStore<T>(body: T, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export async function GET() {
  if (!isSupabaseMode()) {
    return noStore(
      {
        error: "PHONE_HOME_BACKEND_UNAVAILABLE",
        message: "Persistent RINPO Phone home requires the authenticated Supabase runtime.",
      },
      { status: 503 },
    );
  }

  const supabase = await createWebsiteServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return noStore({ error: "UNAUTHENTICATED" }, { status: 401 });
  }

  const memberships = await loadMemberships(
    supabase as unknown as TenancySupabaseClient,
    user.id,
  );

  const activeOrganizationId = (await cookies()).get(ACTIVE_ORG_COOKIE)?.value?.trim() || null;
  const metadata = user.user_metadata as { display_name?: string } | undefined;

  return noStore(
    resolveRinpoPhoneHome({
      userId: user.id,
      email: user.email,
      displayName: metadata?.display_name ?? null,
      memberships,
      activeOrganizationId,
    }),
  );
}
