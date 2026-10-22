import { NextRequest, NextResponse } from "next/server";
import { parseSignedWixInstance } from "@/lib/integrations/wix-instance";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { resolveWebsiteTenancy } from "@/lib/tenancy";

function redirect(request: NextRequest, state: string, status = 303) {
  const url = new URL("/integrations/wix", request.url);
  url.searchParams.set("connection", state);
  return NextResponse.redirect(url, status);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return NextResponse.json({ error: "Origin required" }, { status: 403 });

  try {
    if (new URL(origin).host !== request.nextUrl.host) {
      return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const appSecret = process.env.WIX_APP_SECRET?.trim();
  if (!appSecret) return redirect(request, "not-configured");

  const form = await request.formData();
  const signedInstance = form.get("signedInstance");
  if (typeof signedInstance !== "string" || signedInstance.length > 16_384) {
    return redirect(request, "invalid-instance");
  }

  const instance = parseSignedWixInstance(signedInstance, appSecret);
  if (!instance) return redirect(request, "invalid-instance");

  const tenancy = await resolveWebsiteTenancy();
  if (!tenancy) return redirect(request, "auth-required");
  if (!tenancy.permissions.includes("org.manage")) return redirect(request, "forbidden");

  const supabase = await createWebsiteServerClient();
  // The repo still carries handwritten database types rather than generated
  // project types, so RPC argument inference is incomplete. Keep this cast
  // narrow to the single reviewed function signature until `supabase gen types`
  // becomes the platform source of truth.
  const { error } = await (
    supabase as unknown as {
      rpc: (
        fn: "bind_integration_connection",
        args: {
          p_provider: string;
          p_external_instance_id: string;
          p_organization_id: string;
        },
      ) => Promise<{ data: string | null; error: { code?: string; message: string } | null }>;
    }
  ).rpc("bind_integration_connection", {
    p_provider: "wix",
    p_external_instance_id: instance.instanceId,
    p_organization_id: tenancy.organizationId,
  });

  if (error) {
    console.error("wix-bind", {
      code: error.code,
      organizationId: tenancy.organizationId,
    });
    return redirect(request, "failed");
  }

  return redirect(request, "connected");
}
