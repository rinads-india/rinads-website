import { checkProductionEnvContract } from "@rinads/auth";

// Never statically optimized: this endpoint exists to report live
// configuration health, so every request must re-evaluate current env vars.
export const dynamic = "force-dynamic";

/**
 * Health check for uptime monitoring. Deliberately excluded from
 * middleware's matcher (see middleware.ts) so it stays reachable even if
 * the production env contract check would otherwise 503 every other
 * route — that's the whole point: a monitor hitting this endpoint should
 * be able to tell "the app is up, but misconfigured" apart from "the app
 * is completely down". See docs/deployment/POLICY.md.
 */
export async function GET() {
  const envContract = checkProductionEnvContract();

  if (!envContract.ok) {
    console.error(`[production-env-contract] ${envContract.message}`);
  }

  return Response.json(
    {
      status: envContract.ok ? "ok" : "degraded",
      checks: {
        productionEnvContract: envContract.ok ? "ok" : "failed",
      },
      timestamp: new Date().toISOString(),
    },
    { status: envContract.ok ? 200 : 503 }
  );
}
