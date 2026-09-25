import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  allowDevelopmentAuthBypass,
  checkProductionEnvContract,
  getSharedAuthCookieOptions,
  renderProductionEnvContractUnavailablePage,
  resolvePortalMiddlewareDecision,
} from "@rinads/auth";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(request: NextRequest) {
  // Fail closed on every request if a production deploy is misconfigured
  // with demo auth / demo data. See docs/deployment/POLICY.md. This must
  // never throw here — an unguarded throw crashes the whole middleware
  // invocation (MIDDLEWARE_INVOCATION_FAILED) instead of returning a
  // controlled response.
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

  if (allowDevelopmentAuthBypass()) {
    const decision = resolvePortalMiddlewareDecision({
      pathname: request.nextUrl.pathname,
      search: request.nextUrl.search,
      isAuthenticated: true,
    });
    if (decision.type === "redirect") {
      return NextResponse.redirect(new URL(decision.to, request.url));
    }
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const cookieOptions = getSharedAuthCookieOptions();
  let response = NextResponse.next({ request: { headers: request.headers } });
  let pendingCookies: CookieToSet[] = [];
  let isAuthenticated = false;

  if (url && anonKey) {
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
    const { data } = await supabase.auth.getUser();
    isAuthenticated = Boolean(data.user);
  }

  const decision = resolvePortalMiddlewareDecision({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    isAuthenticated,
  });
  if (decision.type === "redirect") {
    const redirect = NextResponse.redirect(new URL(decision.to, request.url));
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
