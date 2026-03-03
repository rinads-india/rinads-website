"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { LoginRole } from "@/components/rinpo/LoginModal";

const AUTH_KEY = "rinads_auth";
const USERS_KEY = "rinads_users";

export type AuthUser = {
  username: string;
  role: LoginRole;
};

type StoredUser = AuthUser & { password: string };

type AuthContextType = {
  user: AuthUser | null;
  login: (username: string, password: string, role: LoginRole) => boolean;
  signup: (username: string, password: string, role: LoginRole) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function loadSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    return parsed?.username ? parsed : null;
  } catch {
    return null;
  }
}

function saveSession(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

function loadUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadSession());

  const login = useCallback((username: string, password: string, role: LoginRole): boolean => {
    const users = loadUsers();
    const stored = users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password && u.role === role
    );
    if (!stored) return false;
    const session: AuthUser = { username: stored.username, role: stored.role };
    saveSession(session);
    setUser(session);
    return true;
  }, []);

  const signup = useCallback((username: string, password: string, role: LoginRole): boolean => {
    const users = loadUsers();
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) return false;
    const newUser: StoredUser = { username, password, role };
    users.push(newUser);
    saveUsers(users);
    const session: AuthUser = { username, role };
    saveSession(session);
    setUser(session);
    return true;
  }, []);

  const logout = useCallback(() => {
    saveSession(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
