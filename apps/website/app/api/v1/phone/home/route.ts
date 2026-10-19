import { NextResponse } from "next/server";
import { resolveRinpoPhoneAccess } from "@/lib/rinpo-phone/access";
import { resolveRinpoPhoneHome } from "@/lib/rinpo-phone/home";

const NO_STORE = { "cache-control": "private, no-store" };

export async function GET() {
  const access = await resolveRinpoPhoneAccess();

  if (access.status === "unauthenticated") {
    return NextResponse.json(
      { ok: false, error: "unauthenticated" },
      { status: 401, headers: NO_STORE },
    );
  }

  if (access.status === "unavailable") {
    return NextResponse.json(
      { ok: false, error: "phone_unavailable", message: access.reason },
      { status: 503, headers: NO_STORE },
    );
  }

  try {
    const home = resolveRinpoPhoneHome(access.homeInput);
    return NextResponse.json(
      {
        ok: true,
        organization: access.organizationId
          ? {
              id: access.organizationId,
              name: access.organizationName,
              role: access.roleKey,
            }
          : null,
        workspace: home.workspace,
        apps: home.apps,
        identity: {
          persistence: "provisional-auth-backed",
          device: "unregistered-web",
        },
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error("[rinpo-phone-home] invalid runtime context", error);
    return NextResponse.json(
      { ok: false, error: "invalid_runtime_context" },
      { status: 500, headers: NO_STORE },
    );
  }
}
