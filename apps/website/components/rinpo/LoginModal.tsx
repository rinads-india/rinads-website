"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DEMO_ALLOWED_ROLES, type DemoAllowedRole } from "@/lib/demo-auth";

/** @deprecated Privileged roles removed from public demo UI. Kept for type narrowing elsewhere. */
export type LoginRole = DemoAllowedRole | "founder" | "super-admin";

const ROLES: { id: DemoAllowedRole; label: string }[] = [
  { id: "client", label: "Client" },
  { id: "staff", label: "Staff" },
  { id: "admin", label: "Admin" },
];

type LoginModalProps = {
  isOpen: boolean;
  initialMode?: "login" | "signup";
  onClose: () => void;
  onLogin?: (username: string, password: string, role: LoginRole) => boolean;
  onSignup?: (username: string, password: string, role: LoginRole) => boolean;
};

export function LoginModal({ isOpen, initialMode = "login", onClose, onLogin, onSignup }: LoginModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<DemoAllowedRole>("client");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setMode(initialMode);
        setError(null);
      });
    }
  }, [isOpen, initialMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!(DEMO_ALLOWED_ROLES as readonly string[]).includes(role)) {
      setError("Privileged roles cannot be selected in demo mode.");
      return;
    }
    let ok = false;
    if (mode === "login") {
      ok = onLogin?.(username, password, role) ?? false;
      if (!ok) setError("Demo session could not start. Check username and role.");
    } else {
      ok = onSignup?.(username, password, role) ?? false;
      if (!ok) setError("Demo session could not start. Check username and role.");
    }
    if (ok) {
      onClose();
      setUsername("");
      setPassword("");
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
            className="fixed inset-0 z-[61] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="w-full max-w-md rounded-2xl border-2 border-[var(--rinads-primary)] bg-[var(--background)] p-6 shadow-[0_0_40px_var(--rinads-glow)]"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 22 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="rinads-demo-login-title"
            >
              <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-sm text-amber-100">
                <p className="font-semibold tracking-wide">DEMO MODE — NOT FOR PRODUCTION</p>
                <p className="mt-1 text-amber-100/80">
                  Passwords are not stored. This is not secure authentication. Founder and Super Admin
                  cannot be self-assigned.
                </p>
              </div>

              <div className="flex items-center justify-between mb-6">
                <h2 id="rinads-demo-login-title" className="text-xl font-bold text-[var(--rinads-white)]">
                  {mode === "login" ? "Demo Login" : "Demo Sign Up"}
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
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--rinads-primary)]/50 bg-black/40 text-[var(--rinads-white)] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--rinads-primary)]"
                    placeholder="Enter username"
                    required
                    autoComplete="username"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-sm text-red-300">
                    {error}
                  </div>
                )}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Password (not stored)
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--rinads-primary)]/50 bg-black/40 text-[var(--rinads-white)] placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--rinads-primary)]"
                    placeholder="Any value — never persisted"
                    required
                    autoComplete="current-password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    {mode === "login" ? "Demo role" : "Demo role"}
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

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-[var(--rinads-primary)] text-white font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--rinads-primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
                  >
                    {mode === "login" ? "Start Demo" : "Start Demo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
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
