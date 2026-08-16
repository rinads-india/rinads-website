import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { findRedirectForPath, listRedirects } from "@rinads/cms";
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
