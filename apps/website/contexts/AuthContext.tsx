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

const AUTH_KEY = "rinads_auth";
const USERS_KEY = "rinads_users";

export type AuthUser = {
  username: string;
  role: LoginRole;
  demo: true;
};

type AuthContextType = {
  user: AuthUser | null;
  login: (username: string, password: string, role: LoginRole) => boolean;
  signup: (username: string, password: string, role: LoginRole) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isDemoMode: true;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function quarantineLegacyAuthStorage() {
  if (typeof window === "undefined") return;
  // P0: wipe plaintext password store immediately
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
    // Re-save without any credential fields, marked demo
    localStorage.setItem(
      AUTH_KEY,
      JSON.stringify({
        username: parsed.username,
        role: parsed.role,
        demo: true,
      } satisfies AuthUser)
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
      } satisfies AuthUser)
    );
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

function createDemoSession(username: string, role: LoginRole): AuthUser | null {
  const trimmed = username.trim();
  if (!trimmed) return null;
  if (!isDemoAllowedRole(role)) return null;
  // Password is intentionally ignored and never stored.
  return { username: trimmed, role, demo: true };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    quarantineLegacyAuthStorage();
    queueMicrotask(() => {
      setUser(loadDemoSession());
      setHydrated(true);
    });
  }, []);

  const login = useCallback((username: string, _password: string, role: LoginRole): boolean => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(USERS_KEY);
    }
    if (!isDemoAllowedRole(role)) {
      return false;
    }
    const session = createDemoSession(username, role);
    if (!session) return false;
    saveDemoSession(session);
    setUser(session);
    return true;
  }, []);

  const signup = useCallback((username: string, _password: string, role: LoginRole): boolean => {
    // Same as login in demo mode — no credential persistence, no privilege escalation.
    return login(username, _password, role);
  }, [login]);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(USERS_KEY);
    }
    saveDemoSession(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: hydrated ? user : null,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isDemoMode: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
