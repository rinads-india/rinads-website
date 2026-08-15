import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const TENANT_HEADER = "x-rinads-organization-id";
const TENANT_SLUG_HEADER = "x-rinads-storefront-slug";

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const host = request.headers.get("host") ?? "";
  const platformDomain = process.env.STOREFRONT_PLATFORM_DOMAIN ?? "store.rinads.com";

  let response = NextResponse.next({ request: { headers: request.headers } });

  const isPlatformHost =
    host.endsWith(`.${platformDomain}`) ||
    (process.env.STOREFRONT_CUSTOM_DOMAIN_RESOLUTION === "1" && !host.includes("localhost"));

  if (isPlatformHost && url && anonKey && process.env.NEXT_PUBLIC_AUTH_PROVIDER === "supabase") {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    });

    const normalized = host.toLowerCase().split(":")[0]!;
    let organizationId: string | null = null;
    let storefrontSlug: string | null = null;

    if (normalized.endsWith(`.${platformDomain}`)) {
      storefrontSlug = normalized.slice(0, -(platformDomain.length + 1));
      if (storefrontSlug && !storefrontSlug.includes(".")) {
        const { data } = await supabase
          .from("organization_settings")
          .select("organization_id, storefront_slug")
          .eq("storefront_slug", storefrontSlug);
        organizationId = data?.[0]?.organization_id ? String(data[0].organization_id) : null;
      }
    } else if (process.env.STOREFRONT_CUSTOM_DOMAIN_RESOLUTION === "1") {
      const { data } = await supabase
        .from("organization_domains")
        .select("organization_id, hostname, status")
        .eq("hostname", normalized);
      const row = data?.find((r) => r.status === "active" || r.status === "verified");
      organizationId = row?.organization_id ? String(row.organization_id) : null;
    }

    if (organizationId) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set(TENANT_HEADER, organizationId);
      if (storefrontSlug) requestHeaders.set(TENANT_SLUG_HEADER, storefrontSlug);
      response = NextResponse.next({ request: { headers: requestHeaders } });
    }
  }

  if (process.env.NEXT_PUBLIC_AUTH_PROVIDER !== "supabase" || !url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
