export type VerifiedSupabaseIdentity = {
  userId: string;
  verification: "claims" | "user";
};

type AuthErrorLike = { message?: string } | null;

type ClaimsResult = {
  data: { claims?: { sub?: unknown } } | null;
  error: AuthErrorLike;
};

type UserResult = {
  data: { user?: { id?: unknown } | null } | null;
  error: AuthErrorLike;
};

type VerifiableSupabaseClient = {
  auth: {
    /** Present in current Supabase Auth SDKs; optional for compatibility with the repo's pinned SDK. */
    getClaims?: () => Promise<ClaimsResult>;
    /** Server-verified fallback for older Supabase Auth SDKs. */
    getUser: () => Promise<UserResult>;
  };
};

/**
 * Resolve a cryptographically/server-verified Supabase identity.
 *
 * Current Supabase SDKs prefer getClaims(), which verifies the access-token
 * signature (JWKS for asymmetric signing keys). The repository is still on an
 * older supabase-js line, so getUser() remains the secure compatibility path
 * until the dependency upgrade is separately validated.
 *
 * Never replace this with getSession() for server authorization: session data
 * read from cookies alone is not a route-protection boundary.
 */
export async function getVerifiedSupabaseIdentity(
  client: unknown
): Promise<VerifiedSupabaseIdentity | null> {
  const supabase = client as VerifiableSupabaseClient;

  if (typeof supabase.auth.getClaims === "function") {
    const { data, error } = await supabase.auth.getClaims();
    const subject = data?.claims?.sub;
    if (error || typeof subject !== "string" || !subject) return null;
    return { userId: subject, verification: "claims" };
  }

  const { data, error } = await supabase.auth.getUser();
  const userId = data?.user?.id;
  if (error || typeof userId !== "string" || !userId) return null;
  return { userId, verification: "user" };
}
