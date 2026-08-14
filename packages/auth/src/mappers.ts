import type { AuthSession, AuthUser } from "./types";

type SupabaseUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: { display_name?: string };
};

type SupabaseSessionLike = {
  access_token?: string;
  expires_at?: number;
  user: SupabaseUserLike;
};

export function mapSupabaseUser(user: SupabaseUserLike): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    displayName: user.user_metadata?.display_name ?? null,
  };
}

export function mapSupabaseSession(session: SupabaseSessionLike): AuthSession {
  return {
    user: mapSupabaseUser(session.user),
    accessToken: session.access_token,
    expiresAt: session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : undefined,
    demo: false,
  };
}
