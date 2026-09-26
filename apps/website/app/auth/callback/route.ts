import { NextResponse } from "next/server";
import {
  CANONICAL_FORGOT_PASSWORD_URL,
  exchangeCodeForSession,
  hasAuthCallbackGrant,
  parseRecoveryOtpType,
  resolveAuthCallbackDestination,
  verifyOtpToken,
} from "@rinads/auth";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import { isSupabaseMode } from "@/lib/supabase/env";

function redirectTo(request: Request, destination: string) {
  if (destination.startsWith("https://")) {
    return NextResponse.redirect(destination);
  }
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL(destination, origin));
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const next = resolveAuthCallbackDestination(requestUrl.searchParams.get("next"));

  if (!isSupabaseMode()) {
    return redirectTo(request, "/signup?mode=login");
  }

  if (!hasAuthCallbackGrant({ code, tokenHash, type })) {
    return redirectTo(request, "/signup?mode=login");
  }

  try {
    const supabase = await createWebsiteServerClient();
    if (code) {
      const result = await exchangeCodeForSession(supabase, code);
      if (result.error || !result.session) {
        return NextResponse.redirect(CANONICAL_FORGOT_PASSWORD_URL);
      }
    } else if (tokenHash) {
      const otpType = parseRecoveryOtpType(type);
      if (!otpType) {
        return NextResponse.redirect(CANONICAL_FORGOT_PASSWORD_URL);
      }
      const result = await verifyOtpToken(supabase, { tokenHash, type: otpType });
      if (result.error || !result.session) {
        return NextResponse.redirect(CANONICAL_FORGOT_PASSWORD_URL);
      }
    }
  } catch {
    return NextResponse.redirect(CANONICAL_FORGOT_PASSWORD_URL);
  }

  return redirectTo(request, next);
}
