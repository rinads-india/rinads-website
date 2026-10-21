import { NextRequest, NextResponse } from "next/server";
import { createWebsiteServerClient } from "@/lib/supabase/server";
import type {
  WorldBootstrapPayload,
  WorldPlace,
  WorldSession,
} from "@rinads/world-contract";
import { WORLD_BRIDGE_VERSION } from "@rinads/world-contract";

export const runtime = "nodejs";

// WORLD is currently in PREVIEW — set to true when the Unity build is live
const WORLD_LIVE = false;
const WORLD_URL = process.env.NEXT_PUBLIC_WORLD_URL ?? "https://world.rinads.com";

const PLACES: WorldPlace[] = [
  {
    id: "plaza",
    slug: "world-plaza",
    name: "RINADS Plaza",
    description: "The central hub — discover products and meet brands.",
    scene_anchor: "Plaza_Main",
    public: true,
  },
  {
    id: "market",
    slug: "world-market",
    name: "RI Market",
    description: "Browse and transact with service providers in immersive 3D.",
    scene_anchor: "Market_Hall",
    public: true,
  },
  {
    id: "campus",
    slug: "world-campus",
    name: "RI Campus",
    description: "Learn, train, and connect with the RINADS community.",
    scene_anchor: "Campus_Atrium",
    public: true,
  },
  {
    id: "os-tower",
    slug: "world-os-tower",
    name: "Business OS Tower",
    description: "Access your Business OS from inside RINADS WORLD.",
    scene_anchor: "OSTower_Lobby",
    public: false,
  },
];

export async function GET(req: NextRequest) {
  const supabase = await createWebsiteServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let session: WorldSession | null = null;

  if (user) {
    // Resolve org + role for the session token
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id, roles(name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    const orgId = (membership as any)?.organization_id ?? null;
    const role = (membership as any)?.roles?.name ?? null;

    // Session token: base64(userId:orgId:exp) — not a JWT, not a secret
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const raw = `${user.id}:${orgId ?? ""}:${exp}`;
    const token = Buffer.from(raw).toString("base64url");

    session = {
      session_token: token,
      user_id: user.id,
      org_id: orgId,
      role,
      expires_at: exp,
      entry_anchor: "Plaza_Main",
    };
  }

  const places = user ? PLACES : PLACES.filter((p) => p.public);

  const payload: WorldBootstrapPayload = {
    version: WORLD_BRIDGE_VERSION,
    world_url: WORLD_URL,
    places,
    entities: [],
    session,
    generated_at: new Date().toISOString(),
    live: WORLD_LIVE,
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store",
      "X-World-Bridge-Version": WORLD_BRIDGE_VERSION,
    },
  });
}
