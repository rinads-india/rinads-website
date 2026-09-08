import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { assertProductionEnvContract } from "@rinads/auth";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const PUBLIC_PATHS = ["/login"];

export async function middleware(request: NextRequest) {
  // Fail closed on every request if a production deploy is misconfigured
  // with demo auth / demo data. See docs/deployment/POLICY.md. apps/rinaglow
  // has no demo-mode fallback at all — it is the first real-tenant surface.
  assertProductionEnvContract();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!url || !anonKey) {
    // Not configured — let requests through; server components will show a
    // clear "not configured" state rather than silently degrading to demo data.
    return NextResponse.next();
  }

  let response = NextResponse.next({ request: { headers: request.headers } });
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/calendar", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
