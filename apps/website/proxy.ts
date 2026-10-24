import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { findRedirectForPath, listRedirects } from "@rinads/cms";
import {
  checkProductionEnvContract,
  getSharedAuthCookieOptions,
  renderProductionEnvContractUnavailablePage,
} from "@rinads/auth";
import { getWebsiteCmsClient } from "@/lib/cms-client";
import {
  resolveWebsiteAuthDecision,
  type WebsiteAuthDecision,
} from "@/lib/auth-route-policy";
import { resolveWebsiteSupabasePublicKey } from "@/lib/supabase/env";
import { getVerifiedSupabaseIdentity } from "@/lib/supabase/verified-auth";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function unavailable(message: string) {
  console.error(`[auth-proxy] ${message}`);
  return new NextResponse(renderProductionEnvContractUnavailablePage(), {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "retry-after": "60",
    },
  });
}

function markAuthResponsePrivate(response: NextResponse): NextResponse {
  response.headers.set("cache-control", "private, no-store");
  return response;
}

function copyResponseCookies(source: NextResponse, target: NextResponse): void {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
}

async function resolveRedirect(pathname: string) {
  const client = await getWebsiteCmsClient();
  const redirects = await listRedirects(client);
  return findRedirectForPath(redirects, pathname);
}

function authRedirectResponse(
  request: NextRequest,
  decision: Extract<WebsiteAuthDecision, { type: "redirect" }>,
  sessionResponse: NextResponse
): NextResponse {
  const redirectResponse = NextResponse.redirect(new URL(decision.to, request.url), 307);
  copyResponseCookies(sessionResponse, redirectResponse);
  return markAuthResponsePrivate(redirectResponse);
}

/**
 * Next.js 16 request boundary for the public website and Business OS.
 *
 * Responsibilities:
 * - enforce the production environment contract;
 * - refresh Supabase SSR cookies;
 * - validate identity server-side before protected routes render;
 * - protect /os and /onboarding while preserving a safe `next` destination;
 * - preserve CMS redirects and x-rinads-pathname for downstream server layouts.
 *
 * Route authorization never trusts getSession() cookie contents. Current
 * Supabase SDKs use getClaims(); the repo's older pinned SDK securely falls
 * back to getUser() through getVerifiedSupabaseIdentity().
 */
export async function proxy(request: NextRequest) {
  const envContract = checkProductionEnvContract();
  if (!envContract.ok) {
    console.error(`[production-env-contract] ${envContract.message}`);
    return unavailable("Production environment contract failed.");
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-rinads-pathname", request.nextUrl.pathname);

  const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER;
  const authMode: "demo" | "supabase" = provider === "supabase" ? "supabase" : "demo";

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  let isAuthenticated = false;

  if (authMode === "supabase") {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const publicKey = resolveWebsiteSupabasePublicKey();
    if (!url || !publicKey) {
      return unavailable("Supabase auth is selected but its public configuration is missing.");
    }

    const cookieOptions = getSharedAuthCookieOptions();
    const supabase = createServerClient(url, publicKey, {
      cookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, { ...options, ...cookieOptions });
          });
          markAuthResponsePrivate(response);
        },
      },
    });

    const identity = await getVerifiedSupabaseIdentity(supabase);
    isAuthenticated = Boolean(identity?.userId);
    markAuthResponsePrivate(response);
  }

  const authDecision = resolveWebsiteAuthDecision({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    authMode,
    isAuthenticated,
  });
  if (authDecision.type === "redirect") {
    return authRedirectResponse(request, authDecision, response);
  }

  const redirect = await resolveRedirect(request.nextUrl.pathname);
  if (redirect) {
    const destination = redirect.toPath.startsWith("http")
      ? redirect.toPath
      : new URL(redirect.toPath, request.url).toString();
    const redirectResponse = NextResponse.redirect(
      destination,
      redirect.permanent ? 308 : 307
    );
    copyResponseCookies(response, redirectResponse);
    if (authMode === "supabase") markAuthResponsePrivate(redirectResponse);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
