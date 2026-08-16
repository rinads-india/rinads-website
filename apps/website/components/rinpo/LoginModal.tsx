"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_ALLOWED_ROLES, type DemoAllowedRole } from "@/lib/demo-auth";
import { useAuth } from "@/contexts/AuthContext";
import { navigateAfterAuth } from "@/lib/post-auth-navigation";

/** Privileged roles exist in CORE but are never selectable in public UI. */
export type LoginRole = DemoAllowedRole | "founder" | "super-admin";

const ROLES: { id: DemoAllowedRole; label: string }[] = [
  { id: "client", label: "Client" },
  { id: "staff", label: "Staff" },
  { id: "admin", label: "Admin" },
];

type AuthHandler = (
  username: string,
  password: string,
  role: LoginRole
) => boolean | Promise<boolean>;

type LoginModalProps = {
  isOpen: boolean;
  initialMode?: "login" | "signup";
  onClose: () => void;
  onLogin?: AuthHandler;
  onSignup?: AuthHandler;
};

export function LoginModal({ isOpen, initialMode = "login", onClose, onLogin, onSignup }: LoginModalProps) {
  const router = useRouter();
  const { authMode, isDemoMode } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<DemoAllowedRole>("client");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setMode(initialMode);
        setError(null);
      });
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isDemoMode && !(DEMO_ALLOWED_ROLES as readonly string[]).includes(role)) {
      setError("Privileged roles cannot be selected in demo mode.");
      return;
    }
    setPending(true);
    try {
      let ok = false;
      if (mode === "login") {
        ok = (await onLogin?.(username, password, role)) ?? false;
        if (!ok) {
          setError(
            authMode === "supabase"
              ? "Sign-in failed. Check email and password."
              : "Demo session could not start. Check username and role."
          );
        }
      } else {
        ok = (await onSignup?.(username, password, role)) ?? false;
        if (!ok) {
          setError(
            authMode === "supabase"
              ? "Sign-up failed. Try another email or check password requirements."
              : "Demo session could not start. Check username and role."
          );
        }
      }
      if (ok) {
        onClose();
        setUsername("");
        setPassword("");
        await navigateAfterAuth(router);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key={initialMode}>
          <motion.div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            className="fixed inset-0 z-[61] flex items-center justify-center overflow-y-auto p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border-2 border-[var(--rinads-primary)] bg-[var(--background)] p-6 shadow-[0_0_40px_var(--rinads-glow)]"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 22 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="rinads-login-title"
            >
              {isDemoMode ? (
                <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-sm text-amber-100">
                  <p className="font-semibold tracking-wide">DEMO MODE — NOT FOR PRODUCTION</p>
                  <p className="mt-1 text-amber-100/80">
                    Passwords are not stored. Founder and Super Admin cannot be self-assigned.
                    Set NEXT_PUBLIC_AUTH_PROVIDER=supabase after applying CORE migrations to enable
                    real auth.
                  </p>
                </div>
              ) : (
                <div className="mb-4 rounded-lg border border-[var(--rinads-primary)]/40 bg-[var(--rinads-primary)]/10 px-3 py-2 text-sm text-[var(--foreground)]">
                  <p className="font-semibold">Supabase Auth</p>
                  <p className="mt-1 opacity-80">
                    Public signup never grants Founder or Super Admin. Organization roles are assigned
                    through RINADS CORE.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <h2 id="rinads-login-title" className="text-xl font-bold text-[var(--rinads-white)]">
                  {mode === "login"
                    ? isDemoMode
                      ? "Demo Login"
                      : "Sign in"
                    : isDemoMode
                      ? "Demo Sign Up"
                      : "Create account"}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 text-[var(--rinads-white)] transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    {isDemoMode ? "Username" : "Email"}
                  </label>
                  <input
                    id="username"
                    type={isDemoMode ? "text" : "email"}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--rinads-primary)]/50 bg-black/40 text-[var(--rinads-white)] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--rinads-primary)]"
                    placeholder={isDemoMode ? "Enter username" : "you@company.com"}
                    required
                    autoComplete={isDemoMode ? "username" : "email"}
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-300">
                    {error}
                  </div>
                )}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    {isDemoMode ? "Password (not stored)" : "Password"}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--rinads-primary)]/50 bg-black/40 text-[var(--rinads-white)] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--rinads-primary)]"
                    placeholder={isDemoMode ? "Any value — never persisted" : "Enter password"}
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                </div>

                {isDemoMode && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Demo role
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ROLES.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            role === r.id
                              ? "bg-[var(--rinads-primary)] text-white"
                              : "bg-white/10 text-[var(--foreground)] hover:bg-white/20"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 py-3 rounded-xl bg-[var(--rinads-primary)] text-white font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--rinads-primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:opacity-60"
                  >
                    {pending
                      ? "Please wait…"
                      : mode === "login"
                        ? isDemoMode
                          ? "Start Demo"
                          : "Sign in"
                        : isDemoMode
                          ? "Start Demo"
                          : "Sign up"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === "login" ? "signup" : "login");
                      setError(null);
                    }}
                    className="px-4 py-3 rounded-xl border-2 border-[var(--rinads-primary)] text-[var(--rinads-primary)] font-semibold hover:bg-[var(--rinads-primary)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--rinads-primary)]"
                  >
                    {mode === "login" ? "Sign Up" : "Login"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
