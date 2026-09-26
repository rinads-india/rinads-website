import type { AuthSession, SignInWithPasswordInput, SignUpInput } from "./types";
import { mapSupabaseSession } from "./mappers";
import type { RecoveryOtpType } from "./callback";

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
    resetPasswordForEmail?: (
      email: string,
      options?: { redirectTo?: string }
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
    exchangeCodeForSession?: (
      code: string
    ) => Promise<{ data: { session: unknown }; error: { message: string } | null }>;
    verifyOtp?: (args: {
      token_hash: string;
      type: RecoveryOtpType;
    }) => Promise<{ data: { session: unknown }; error: { message: string } | null }>;
    updateUser?: (args: {
      password: string;
    }) => Promise<{ data: { user: unknown }; error: { message: string } | null }>;
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

export const PASSWORD_RESET_GENERIC_MESSAGE =
  "If an account exists for that email, a reset link has been sent.";

export async function requestPasswordReset(
  client: SupabaseAuthApi,
  email: string,
  options?: { redirectTo?: string }
): Promise<{ error: string | null }> {
  if (!client.auth.resetPasswordForEmail) {
    return { error: "Password reset is not available." };
  }
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: options?.redirectTo,
  });
  // Never surface whether the account exists.
  void error;
  return { error: null };
}

export async function exchangeCodeForSession(
  client: SupabaseAuthApi,
  code: string
): Promise<{ session: AuthSession | null; error: string | null }> {
  if (!client.auth.exchangeCodeForSession) {
    return { session: null, error: "Code exchange is not available." };
  }
  const { data, error } = await client.auth.exchangeCodeForSession(code);
  if (error) return { session: null, error: error.message };
  if (!data.session) return { session: null, error: "No session returned" };
  return {
    session: mapSupabaseSession(data.session as Parameters<typeof mapSupabaseSession>[0]),
    error: null,
  };
}

export async function verifyOtpToken(
  client: SupabaseAuthApi,
  input: { tokenHash: string; type: RecoveryOtpType }
): Promise<{ session: AuthSession | null; error: string | null }> {
  if (!client.auth.verifyOtp) {
    return { session: null, error: "OTP verification is not available." };
  }
  const { data, error } = await client.auth.verifyOtp({
    token_hash: input.tokenHash,
    type: input.type,
  });
  if (error) return { session: null, error: error.message };
  if (!data.session) return { session: null, error: "No session returned" };
  return {
    session: mapSupabaseSession(data.session as Parameters<typeof mapSupabaseSession>[0]),
    error: null,
  };
}

export async function updatePassword(
  client: SupabaseAuthApi,
  password: string
): Promise<{ error: string | null }> {
  if (!client.auth.updateUser) {
    return { error: "Password update is not available." };
  }
  const { error } = await client.auth.updateUser({ password });
  return { error: error?.message ?? null };
}
