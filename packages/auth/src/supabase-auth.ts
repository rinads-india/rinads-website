import type { AuthSession, SignInWithPasswordInput, SignUpInput } from "./types";
import { mapSupabaseSession } from "./mappers";

/** Minimal Supabase auth surface used by RINADS (avoids tight coupling to client generics). */
export type SupabaseAuthApi = {
  auth: {
    signInWithPassword: (
      creds: SignInWithPasswordInput
    ) => Promise<{ data: { session: unknown }; error: { message: string } | null }>;
    signUp: (args: {
      email: string;
      password: string;
      options?: { data?: Record<string, string> };
    }) => Promise<{ data: { session: unknown }; error: { message: string } | null }>;
    signOut: () => Promise<{ error: { message: string } | null }>;
    getSession: () => Promise<{
      data: { session: unknown };
      error: { message: string } | null;
    }>;
  };
};

export async function signInWithPassword(
  client: SupabaseAuthApi,
  input: SignInWithPasswordInput
): Promise<{ session: AuthSession | null; error: string | null }> {
  const { data, error } = await client.auth.signInWithPassword(input);
  if (error) return { session: null, error: error.message };
  if (!data.session) return { session: null, error: "No session returned" };
  return {
    session: mapSupabaseSession(data.session as Parameters<typeof mapSupabaseSession>[0]),
    error: null,
  };
}

export async function signUpWithPassword(
  client: SupabaseAuthApi,
  input: SignUpInput
): Promise<{ session: AuthSession | null; error: string | null }> {
  const { data, error } = await client.auth.signUp({
    email: input.email,
    password: input.password,
    options: input.displayName
      ? { data: { display_name: input.displayName } }
      : undefined,
  });
  if (error) return { session: null, error: error.message };
  if (!data.session) {
    // Email confirmation may be required
    return { session: null, error: null };
  }
  return {
    session: mapSupabaseSession(data.session as Parameters<typeof mapSupabaseSession>[0]),
    error: null,
  };
}

export async function signOut(client: SupabaseAuthApi): Promise<{ error: string | null }> {
  const { error } = await client.auth.signOut();
  return { error: error?.message ?? null };
}
