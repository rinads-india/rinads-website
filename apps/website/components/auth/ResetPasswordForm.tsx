"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { updatePassword } from "@rinads/auth";
import { createWebsiteBrowserClient } from "@/lib/supabase/browser";

export function ResetPasswordForm() {
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(async () => {
      try {
        const client = createWebsiteBrowserClient();
        const { data } = await client.auth.getSession();
        if (!cancelled) {
          setHasSession(Boolean(data.session));
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setHasSession(false);
          setReady(true);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password requires at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      const client = createWebsiteBrowserClient();
      const { data } = await client.auth.getSession();
      if (!data.session) {
        setHasSession(false);
        setError("This reset link is invalid or expired.");
        return;
      }
      const result = await updatePassword(client, password);
      if (result.error) {
        setError("Password could not be updated. Request a new reset link.");
        return;
      }
      setDone(true);
    } catch {
      setError("Password could not be updated. Request a new reset link.");
    } finally {
      setPending(false);
    }
  };

  if (!ready) {
    return <p className="text-sm text-white/70">Checking reset session…</p>;
  }

  if (!hasSession) {
    return (
      <div className="space-y-3 text-sm text-white/80">
        <p>This reset link is invalid or expired.</p>
        <Link href="/auth/forgot-password" className="text-rinads-primary hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-3 text-sm text-white/80">
        <p>Password updated. You can now sign in.</p>
        <Link href="/signup?mode=login" className="text-rinads-primary hover:underline">
          Continue to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-white">New password</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-white"
        />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="font-medium text-white">Confirm password</span>
        <input
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 text-white"
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
        className="w-full rounded-xl bg-rinads-primary px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
