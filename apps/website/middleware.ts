import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { findRedirectForPath, listRedirects } from "@rinads/cms";
import { checkProductionEnvContract, renderProductionEnvContractUnavailablePage } from "@rinads/auth";
import { getWebsiteCmsClient } from "@/lib/cms-client";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

async function resolveRedirect(pathname: string) {
  const client = await getWebsiteCmsClient();
  const redirects = await listRedirects(client);
  return findRedirectForPath(redirects, pathname);
}

/**
 * Refresh Supabase session cookies when auth_supabase mode is enabled.
 * Applies CMS redirects when configured.
 */
export async function middleware(request: NextRequest) {
  // Fail closed on every request if a production deploy is misconfigured
  // with demo auth / demo data. See docs/deployment/POLICY.md. This must
  // never throw here — an unguarded throw crashes the whole middleware
  // invocation (MIDDLEWARE_INVOCATION_FAILED) instead of returning a
  // controlled response. This is the exact class of outage that took down
  // production: see docs/deployment/POLICY.md for the incident runbook.
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

  const redirect = await resolveRedirect(request.nextUrl.pathname);
  if (redirect) {
    const destination = redirect.toPath.startsWith("http")
      ? redirect.toPath
      : new URL(redirect.toPath, request.url).toString();
    return NextResponse.redirect(destination, redirect.permanent ? 308 : 307);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const provider = process.env.NEXT_PUBLIC_AUTH_PROVIDER;

  if (provider !== "supabase" || !url || !anonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: request.headers } });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
