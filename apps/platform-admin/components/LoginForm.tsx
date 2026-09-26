"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CANONICAL_FORGOT_PASSWORD_URL,
  sanitizeRelativeNext,
  signInWithPassword,
} from "@rinads/auth";
import { createPlatformBrowserClient } from "@/lib/supabase/browser";

export function LoginForm({ defaultNext = "/" }: { defaultNext?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeRelativeNext(searchParams.get("next")) ?? defaultNext;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const client = createPlatformBrowserClient();
      const { session, error: signInError } = await signInWithPassword(client, {
        email: email.trim(),
        password,
      });
      if (signInError || !session) {
        setError("Sign-in failed. Check email and password.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Sign-in is unavailable. Authentication is not configured.");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-foreground"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-foreground"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-rinads-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        <a href={CANONICAL_FORGOT_PASSWORD_URL} className="text-rinads-primary hover:underline">
          Forgot password?
        </a>
      </p>
    </form>
  );
}
