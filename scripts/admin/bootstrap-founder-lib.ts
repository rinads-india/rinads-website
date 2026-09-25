/**
 * Idempotent founder bootstrap — SERVER ONLY.
 * Never generates or logs passwords or secrets.
 */

export const DEFAULT_FOUNDER_EMAIL = "rinads.india@gmail.com";
export const PLATFORM_ORG_SLUG = "rinads-platform";
export const PLATFORM_ORG_NAME = "RINADS Platform";
export const FOUNDER_ROLE_KEY = "founder";
export const CANONICAL_BOOTSTRAP_REDIRECT =
  "https://www.rinads.com/auth/callback?next=/auth/reset-password";

type EqBuilder = {
  eq: (column: string, value: string) => EqBuilder & {
    maybeSingle: () => Promise<{
      data: Record<string, unknown> | null;
      error: { message: string } | null;
    }>;
  };
};

export type BootstrapAdminClient = {
  auth: {
    admin: {
      listUsers: (args: {
        page: number;
        perPage: number;
      }) => Promise<{
        data: { users: Array<{ id: string; email?: string | null }> };
        error: { message: string } | null;
      }>;
      inviteUserByEmail: (
        email: string,
        options: { redirectTo: string }
      ) => Promise<{
        data: { user: { id: string; email?: string | null } | null };
        error: { message: string } | null;
      }>;
    };
  };
  from: (table: string) => {
    select: (columns: string) => EqBuilder;
    insert: (row: Record<string, unknown>) => Promise<{
      data: Record<string, unknown> | null;
      error: { message: string } | null;
    }> & {
      select: (columns: string) => {
        single: () => Promise<{
          data: Record<string, unknown> | null;
          error: { message: string } | null;
        }>;
      };
    };
    update: (row: Record<string, unknown>) => {
      eq: (
        column: string,
        value: string
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export type BootstrapResult = {
  email: string;
  userId: string;
  organizationId: string;
  invited: boolean;
  organizationCreated: boolean;
  membershipCreated: boolean;
};

export function parseBootstrapEmail(argv: string[], fallback = DEFAULT_FOUNDER_EMAIL): string {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--email" && argv[i + 1]) {
      return argv[i + 1].trim().toLowerCase();
    }
  }
  return fallback.trim().toLowerCase();
}

export function requireServiceRoleEnv(env: NodeJS.Dict<string>): {
  url: string;
  serviceRoleKey: string;
} {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. This script never generates passwords."
    );
  }
  return { url, serviceRoleKey };
}

async function findUserByEmail(
  admin: BootstrapAdminClient,
  email: string
): Promise<{ id: string; email?: string | null } | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

export async function bootstrapFounder(
  admin: BootstrapAdminClient,
  email: string
): Promise<BootstrapResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail.includes("@")) {
    throw new Error("A valid founder email is required.");
  }

  let invited = false;
  let user = await findUserByEmail(admin, normalizedEmail);
  if (!user) {
    const invitedUser = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo: CANONICAL_BOOTSTRAP_REDIRECT,
    });
    if (invitedUser.error) {
      user = await findUserByEmail(admin, normalizedEmail);
      if (!user) throw new Error(invitedUser.error.message);
    } else if (invitedUser.data.user) {
      user = invitedUser.data.user;
      invited = true;
    } else {
      user = await findUserByEmail(admin, normalizedEmail);
    }
  }
  if (!user) {
    throw new Error("Unable to find or invite founder user.");
  }

  const existingOrg = await admin
    .from("organizations")
    .select("id, slug, name")
    .eq("slug", PLATFORM_ORG_SLUG)
    .maybeSingle();
  if (existingOrg.error) throw new Error(existingOrg.error.message);

  let organizationCreated = false;
  let organizationId = existingOrg.data?.id ? String(existingOrg.data.id) : "";
  if (!organizationId) {
    const created = await admin.from("organizations").insert({
      name: PLATFORM_ORG_NAME,
      slug: PLATFORM_ORG_SLUG,
      status: "active",
      created_by: user.id,
    }).select("id").single();
    if (created.error || !created.data?.id) {
      throw new Error(created.error?.message ?? "Failed to create rinads-platform organization.");
    }
    organizationId = String(created.data.id);
    organizationCreated = true;
  }

  const founderRole = await admin.from("roles").select("id, key").eq("key", FOUNDER_ROLE_KEY).maybeSingle();
  if (founderRole.error || !founderRole.data?.id) {
    throw new Error(founderRole.error?.message ?? "Founder role is missing. Apply CORE identity migrations.");
  }

  const existingMember = await admin
    .from("organization_members")
    .select("id, user_id, role_id, status")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existingMember.error) throw new Error(existingMember.error.message);

  let membershipCreated = false;
  if (!existingMember.data) {
    const inserted = await admin.from("organization_members").insert({
      organization_id: organizationId,
      user_id: user.id,
      role_id: founderRole.data.id,
      status: "active",
    });
    if (inserted.error) throw new Error(inserted.error.message);
    membershipCreated = true;
  } else if (String(existingMember.data.role_id) !== String(founderRole.data.id)) {
    const updated = await admin.from("organization_members").update({
      role_id: founderRole.data.id,
      status: "active",
      organization_id: organizationId,
    }).eq("id", String(existingMember.data.id));
    if (updated.error) throw new Error(updated.error.message);
  }

  const audit = await admin.from("audit_logs").insert({
    organization_id: organizationId,
    actor_type: "system",
    actor_id: "bootstrap-founder",
    action: "founder.bootstrap",
    entity: "organization_members",
    entity_id: user.id,
    after: {
      email: normalizedEmail,
      organizationSlug: PLATFORM_ORG_SLUG,
      invited,
      organizationCreated,
      membershipCreated,
    },
    source: "scripts/admin/bootstrap-founder.ts",
  });
  if (audit.error) throw new Error(audit.error.message);

  return {
    email: normalizedEmail,
    userId: user.id,
    organizationId,
    invited,
    organizationCreated,
    membershipCreated,
  };
}
