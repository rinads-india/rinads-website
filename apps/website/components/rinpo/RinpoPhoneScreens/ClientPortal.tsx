"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

export function ClientPortal() {
  const { user, login, logout, isAuthenticated } = useAuth();
  const { setLoginModalOpen, setLoginModalMode, setPhoneOpen } = useRinpo();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isClient = user?.role === "client";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const ok = login(username, password, "client");
    if (!ok) setError("Demo session could not start.");
  };

  if (isAuthenticated && isClient) {
    return (
      <div className="flex flex-col h-full p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--rinads-primary)]">Client Portal</h3>
            <button
              type="button"
              onClick={logout}
              className="text-xs text-white/60 hover:text-white/80"
            >
              Sign out
            </button>
          </div>
          <p className="text-xs text-white/80">
            Welcome, <span className="text-[var(--rinads-primary)] font-medium">{user?.username}</span>.
          </p>
          <div className="space-y-3">
            <div className="rounded-xl bg-white/5 border border-[var(--rinads-primary)]/30 p-3">
              <h4 className="text-xs font-semibold text-[var(--rinads-primary)] mb-1">Projects</h4>
              <p className="text-xs text-white/60">No active projects.</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-[var(--rinads-primary)]/30 p-3">
              <h4 className="text-xs font-semibold text-[var(--rinads-primary)] mb-1">Invoices</h4>
              <p className="text-xs text-white/60">No pending invoices.</p>
            </div>
            <div className="rounded-xl bg-white/5 border border-[var(--rinads-primary)]/30 p-3">
              <h4 className="text-xs font-semibold text-[var(--rinads-primary)] mb-1">Support</h4>
              <p className="text-xs text-white/60">No open tickets.</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated && !isClient) {
    return (
      <div className="flex flex-col h-full p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-semibold text-[var(--rinads-primary)]">Client Portal</h3>
          <p className="text-xs text-white/80">
            You are signed in as <span className="text-[var(--rinads-primary)]">{user?.username}</span> ({user?.role}).
            Sign out and use a client account to access the portal.
          </p>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-[var(--rinads-primary)]/80 px-4 py-2 text-xs font-medium text-white"
          >
            Sign out
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h3 className="text-sm font-semibold text-[var(--rinads-primary)]">Client Portal</h3>
        <p className="text-xs text-white/80">
          Sign in to access your projects, invoices, and support tickets.
        </p>
        <form onSubmit={handleLogin} className="space-y-3">
          {error && (
            <div className="rounded-lg bg-red-500/20 border border-red-500/50 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="portal-username" className="block text-xs font-medium text-white/80 mb-1">
              Username
            </label>
            <input
              id="portal-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--rinads-primary)]/50 bg-black/40 text-[var(--rinads-white)] placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--rinads-primary)]"
              placeholder="Username"
              required
            />
          </div>
          <div>
            <label htmlFor="portal-password" className="block text-xs font-medium text-white/80 mb-1">
              Password
            </label>
            <input
              id="portal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--rinads-primary)]/50 bg-black/40 text-[var(--rinads-white)] placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--rinads-primary)]"
              placeholder="Password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[var(--rinads-primary)] text-white text-sm font-semibold hover:opacity-90"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginModalMode("signup");
              setLoginModalOpen(true);
              setPhoneOpen(false);
            }}
            className="w-full py-2 rounded-lg border border-[var(--rinads-primary)]/50 text-[var(--rinads-primary)] text-xs font-medium hover:bg-[var(--rinads-primary)]/10"
          >
            Create account
          </button>
        </form>
      </motion.div>
    </div>
  );
}
