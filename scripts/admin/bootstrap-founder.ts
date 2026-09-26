#!/usr/bin/env node
/**
 * SERVER ONLY. Idempotent founder bootstrap.
 * Usage:
 *   pnpm admin:bootstrap-founder
 *   pnpm admin:bootstrap-founder -- --email someone@example.com
 *
 * Never generates or logs passwords or secrets.
 */
import { createClient } from "@supabase/supabase-js";
import {
  bootstrapFounder,
  parseBootstrapEmail,
  requireServiceRoleEnv,
  type BootstrapAdminClient,
} from "./bootstrap-founder-lib.ts";

async function main() {
  const { url, serviceRoleKey } = requireServiceRoleEnv(process.env);
  const email = parseBootstrapEmail(process.argv.slice(2));
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as unknown as BootstrapAdminClient;

  const result = await bootstrapFounder(admin, email);
  console.log(
    JSON.stringify(
      {
        ok: true,
        email: result.email,
        userId: result.userId,
        organizationId: result.organizationId,
        invited: result.invited,
        organizationCreated: result.organizationCreated,
        membershipCreated: result.membershipCreated,
        redirectTo: "https://www.rinads.com/auth/callback?next=/auth/reset-password",
        note: "Invite/recovery uses the canonical www.rinads.com callback. No password was generated or logged.",
      },
      null,
      2
    )
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Bootstrap failed";
  console.error(message);
  process.exit(1);
});
