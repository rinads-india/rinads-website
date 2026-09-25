"use client";

import { useState, type FormEvent } from "react";
import {
  CANONICAL_AUTH_CALLBACK_URL,
  PASSWORD_RESET_GENERIC_MESSAGE,
  requestPasswordReset,
} from "@rinads/auth";
import { createWebsiteBrowserClient } from "@/lib/supabase/browser";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    try {
      const client = createWebsiteBrowserClient();
      await requestPasswordReset(client, email.trim(), {
        redirectTo: `${CANONICAL_AUTH_CALLBACK_URL}?next=${encodeURIComponent("/auth/reset-password")}`,
      });
    } catch {
      // Same generic outcome — never reveal account existence or config errors.
    } finally {
      setSubmitted(true);
      setPending(false);
    }
  };

  if (submitted) {
    return (
      <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80" role="status">
        {PASSWORD_RESET_GENERIC_MESSAGE}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-white">Email</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-white"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-rinads-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
