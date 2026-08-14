"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import type { LoginRole } from "@/components/rinpo/LoginModal";
import { isDemoAllowedRole } from "@/lib/demo-auth";
import { isSupabaseMode } from "@/lib/supabase/env";
import { createWebsiteBrowserClient } from "@/lib/supabase/browser";
import {
  signInWithPassword,
  signUpWithPassword,
  signOut as supabaseSignOut,
} from "@rinads/auth";

const AUTH_KEY = "rinads_auth";
const USERS_KEY = "rinads_users";

export type AuthUser = {
  id?: string;
  username: string;
  email?: string | null;
  role: LoginRole;
  demo: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  login: (username: string, password: string, role: LoginRole) => boolean | Promise<boolean>;
  signup: (username: string, password: string, role: LoginRole) => boolean | Promise<boolean>;
  logout: () => void | Promise<void>;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  authMode: "demo" | "supabase";
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function quarantineLegacyAuthStorage() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USERS_KEY);
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<AuthUser> & { password?: string };
    if (parsed?.password) {
      localStorage.removeItem(AUTH_KEY);
      return;
    }
    if (!parsed?.username || !isDemoAllowedRole(parsed.role)) {
      localStorage.removeItem(AUTH_KEY);
      return;
    }
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        username: parsed.username,
        role: parsed.role,
        demo: true,
      })
    );
  } catch {
    localStorage.removeItem(AUTH_KEY);
  }
}

function loadDemoSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (!parsed?.username || !isDemoAllowedRole(parsed.role)) return null;
    return { username: parsed.username, role: parsed.role as LoginRole, demo: true };
  } catch {
    return null;
  }
}

function saveDemoSession(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        username: user.username,
        role: user.role,
        demo: true,
      })
    );
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const authMode: "demo" | "supabase" = isSupabaseMode() ? "supabase" : "demo";
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      if (authMode === "demo") {
        quarantineLegacyAuthStorage();
        setUser(loadDemoSession());
        setHydrated(true);
        return;
      }

      try {
        const client = createWebsiteBrowserClient();
        const { data } = await client.auth.getSession();
        const session = data.session;
        if (session?.user) {
          setUser({
            id: session.user.id,
            username: session.user.email ?? session.user.id,
            email: session.user.email,
            role: "client",
            demo: false,
          });
        }
      } catch {
        setUser(null);
      }
      setHydrated(true);
    });
  }, [authMode]);

  const login = useCallback(
    async (username: string, password: string, role: LoginRole): Promise<boolean> => {
      if (authMode === "demo") {
        if (typeof window !== "undefined") localStorage.removeItem(USERS_KEY);
        if (!isDemoAllowedRole(role)) return false;
        const trimmed = username.trim();
        if (!trimmed) return false;
        const session: AuthUser = { username: trimmed, role, demo: true };
        saveDemoSession(session);
        setUser(session);
        return true;
      }

      try {
        const client = createWebsiteBrowserClient();
        const { session, error } = await signInWithPassword(client, {
          email: username.trim(),
          password,
        });
        if (error || !session) return false;
        setUser({
          id: session.user.id,
          username: session.user.email ?? session.user.id,
          email: session.user.email,
          role: "client",
          demo: false,
        });
        return true;
      } catch {
        return false;
      }
    },
    [authMode]
  );

  const signup = useCallback(
    async (username: string, password: string, role: LoginRole): Promise<boolean> => {
      if (authMode === "demo") {
        return login(username, password, role) as Promise<boolean>;
      }

      // Public signup never assigns privileged roles — membership/roles come from CORE.
      try {
        const client = createWebsiteBrowserClient();
        const { session, error } = await signUpWithPassword(client, {
          email: username.trim(),
          password,
          displayName: username.trim().split("@")[0],
        });
        if (error) return false;
        if (session) {
          setUser({
            id: session.user.id,
            username: session.user.email ?? session.user.id,
            email: session.user.email,
            role: "client",
            demo: false,
          });
        }
        // Email confirmation flows may return null session — still success
        return true;
      } catch {
        return false;
      }
    },
    [authMode, login]
  );

  const logout = useCallback(async () => {
    if (authMode === "demo") {
      if (typeof window !== "undefined") localStorage.removeItem(USERS_KEY);
      saveDemoSession(null);
      setUser(null);
      return;
    }
    try {
      const client = createWebsiteBrowserClient();
      await supabaseSignOut(client);
    } finally {
      setUser(null);
    }
  }, [authMode]);

  return (
    <AuthContext.Provider
      value={{
        user: hydrated ? user : null,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isDemoMode: authMode === "demo",
        authMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
