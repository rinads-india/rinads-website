import { NextResponse } from "next/server";
import { getWixConfigurationStatus } from "@/lib/integrations/wix";

export const dynamic = "force-dynamic";

export async function GET() {
  const wix = getWixConfigurationStatus();

  return NextResponse.json(
    {
      provider: "wix",
      status: "private_preview",
      activationReady: wix.configured,
      installAvailable: Boolean(wix.installUrl),
      installUrl: wix.installUrl,
      architecture: {
        channel: "wix",
        controlPlane: "rinads",
        intelligence: "rinads-intelligence",
        runtime: "rinpo-runtime",
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
