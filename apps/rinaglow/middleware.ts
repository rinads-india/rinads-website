import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  checkProductionEnvContract,
  getSharedAuthCookieOptions,
  renderProductionEnvContractUnavailablePage,
  sanitizeRelativeNext,
} from "@rinads/auth";
import { isRinaglowPublicPath } from "./lib/public-paths";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(request: NextRequest) {
  // Fail closed on every request if a production deploy is misconfigured
  // with demo auth / demo data. See docs/deployment/POLICY.md. apps/rinaglow
  // has no demo-mode fallback at all — it is the first real-tenant surface.
  // This must never throw here — an unguarded throw crashes the whole
  // middleware invocation (MIDDLEWARE_INVOCATION_FAILED) instead of
  // returning a controlled response.
  const envContract = checkProductionEnvContract();
  if (!envContract.ok) {
    console.error(`[production-env-contract] ${envContract.message}`);
    return new NextResponse(renderProductionEnvContractUnavailablePage(), {
      status: 503,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "retry-after": "60",
      },
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;
  const isPublicPath = isRinaglowPublicPath(pathname);

  if (!url || !anonKey) {
    // Not configured — let requests through; server components will show a
    // clear "not configured" state rather than silently degrading to demo data.
    return NextResponse.next();
  }

  const cookieOptions = getSharedAuthCookieOptions();
  let response = NextResponse.next({ request: { headers: request.headers } });
  let pendingCookies: CookieToSet[] = [];
  const supabase = createServerClient(url, anonKey, {
    cookieOptions,
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        pendingCookies = cookiesToSet;
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { ...options, ...cookieOptions })
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    const next = sanitizeRelativeNext(`${pathname}${request.nextUrl.search}`) ?? "/calendar";
    loginUrl.searchParams.set("next", next);
    const redirect = NextResponse.redirect(loginUrl);
    pendingCookies.forEach(({ name, value, options }) => {
      redirect.cookies.set(name, value, { ...options, ...cookieOptions });
    });
    return redirect;
  }

  if (user && pathname === "/login") {
    const next =
      sanitizeRelativeNext(request.nextUrl.searchParams.get("next")) ?? "/calendar";
    const redirect = NextResponse.redirect(new URL(next, request.url));
    pendingCookies.forEach(({ name, value, options }) => {
      redirect.cookies.set(name, value, { ...options, ...cookieOptions });
    });
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
