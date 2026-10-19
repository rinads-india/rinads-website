import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  ACTIVE_ORG_COOKIE,
  activeOrgCookieOptions,
  loadMemberships,
  type TenancySupabaseClient,
} from "@rinads/tenancy";
import { websiteAuthCookieOptions } from "@/lib/auth-cookie-config";
import { isSupabaseMode } from "@/lib/supabase/env";
import { createWebsiteServerClient } from "@/lib/supabase/server";

function response(body: unknown, status = 200) {
  const result = NextResponse.json(body, { status });
  result.headers.set("Cache-Control", "private, no-store, max-age=0");
  return result;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseMode()) {
    return response({ error: "PHONE_WORKSPACE_BACKEND_UNAVAILABLE" }, 503);
  }

  const supabase = await createWebsiteServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return response({ error: "UNAUTHENTICATED" }, 401);

  let workspaceId = "";
  try {
    const body = (await request.json()) as { workspaceId?: unknown };
    workspaceId = typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
  } catch {
    return response({ error: "INVALID_JSON" }, 400);
  }
  if (!workspaceId) return response({ error: "WORKSPACE_REQUIRED" }, 400);

  const cookieStore = await cookies();
  const authScope = websiteAuthCookieOptions();

  if (workspaceId === `personal:${user.id}`) {
    cookieStore.set(ACTIVE_ORG_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      domain: authScope?.domain,
      secure: authScope?.secure,
    });
    return response({ ok: true, workspaceId });
  }

  const memberships = await loadMemberships(
    supabase as unknown as TenancySupabaseClient,
    user.id,
  );
  const membership = memberships.find(
    (candidate) =>
      candidate.organizationId === workspaceId && candidate.organizationStatus === "active",
  );
  if (!membership) return response({ error: "WORKSPACE_FORBIDDEN" }, 403);

  const options = activeOrgCookieOptions(workspaceId, {
    domain: authScope?.domain,
    secure: authScope?.secure,
  });
  cookieStore.set(options.name, options.value, {
    httpOnly: options.httpOnly,
    sameSite: options.sameSite,
    path: options.path,
    maxAge: options.maxAge,
    domain: options.domain,
    secure: options.secure,
  });

  return response({ ok: true, workspaceId });
}
