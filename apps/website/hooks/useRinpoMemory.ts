"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";

export type ChatMessage = {
  id: string;
  role: "user" | "rinpo";
  text: string;
  createdAt: number;
};

export type Reminder = {
  id: string;
  text: string;
  dueDate: string;
  createdAt: number;
};

export type WorkflowRun = {
  id: string;
  workflow: string;
  status: "suggested" | "active" | "complete";
  createdAt: number;
};

export type UserMemoryProfile = {
  username: string;
  role: string;
  interests: string[];
  recentSearches: string[];
  favoriteServices: string[];
  notes: string[];
  messages: ChatMessage[];
  reminders: Reminder[];
  workflows: WorkflowRun[];
  interactionCount: number;
  lastVisitedAt: number;
  preferences: {
    theme?: "dark";
    voiceEnabled: boolean;
    language: "en" | "ml";
  };
};

const MEMORY_STORAGE_PREFIX = "rinpo_memory_v1_";

const DEFAULT_ANONYMOUS_PROFILE: UserMemoryProfile = {
  username: "Guest",
  role: "visitor",
  interests: ["Digital Solutions", "Custom Software", "AI Automation"],
  recentSearches: [],
  favoriteServices: ["Digital Marketing", "AI Automation"],
  notes: ["Exploring RINADS Business Cloud ecosystem."],
  messages: [],
  reminders: [],
  workflows: [],
  interactionCount: 1,
  lastVisitedAt: Date.now(),
  preferences: {
    voiceEnabled: true,
    language: "en",
  },
};

function getStorageKey(userIdentifier: string): string {
  return `${MEMORY_STORAGE_PREFIX}${userIdentifier.toLowerCase().trim()}`;
}

export function loadUserMemory(userIdentifier: string): UserMemoryProfile {
  if (typeof window === "undefined") return { ...DEFAULT_ANONYMOUS_PROFILE, username: userIdentifier };
  try {
    const raw = localStorage.getItem(getStorageKey(userIdentifier));
    if (!raw) {
      return {
        ...DEFAULT_ANONYMOUS_PROFILE,
        username: userIdentifier,
        lastVisitedAt: Date.now(),
      };
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ANONYMOUS_PROFILE,
      ...parsed,
      username: userIdentifier,
    };
  } catch {
    return { ...DEFAULT_ANONYMOUS_PROFILE, username: userIdentifier };
  }
}

export function saveUserMemory(profile: UserMemoryProfile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(profile.username), JSON.stringify(profile));
  } catch (err) {
    console.error("Failed to persist user memory:", err);
  }
}

function mergeGuestMemory(profile: UserMemoryProfile, username: string, role: string): UserMemoryProfile {
  const guest = loadUserMemory("Guest");
  return {
    ...profile,
    username,
    role,
    interests: [...new Set([...profile.interests, ...guest.interests])].slice(0, 8),
    recentSearches: [...new Set([...profile.recentSearches, ...guest.recentSearches])].slice(0, 10),
    favoriteServices: [...new Set([...profile.favoriteServices, ...guest.favoriteServices])],
    notes: [...new Set([...profile.notes, ...guest.notes])].slice(0, 15),
    messages: profile.messages.length ? profile.messages : guest.messages,
    reminders: profile.reminders.length ? profile.reminders : guest.reminders,
    workflows: profile.workflows.length ? profile.workflows : guest.workflows,
  };
}

type RinpoMemoryContextValue = {
  memory: UserMemoryProfile;
  addInterest: (interest: string) => void;
  addSearch: (search: string) => void;
  addFavoriteService: (service: string) => void;
  addNote: (note: string) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "createdAt">) => void;
  addReminder: (text: string, dueDate?: string) => void;
  removeReminder: (id: string) => void;
  startWorkflow: (workflow: string) => void;
  updatePreferences: (preferences: Partial<UserMemoryProfile["preferences"]>) => void;
  getPersonalizedGreeting: () => string;
  getPersonalizedInsight: () => string;
};

const RinpoMemoryContext = createContext<RinpoMemoryContextValue | null>(null);

export function RinpoMemoryProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const currentUsername = isAuthenticated && user?.username ? user.username : "Guest";
  const role = isAuthenticated && user?.role ? user.role : "visitor";

  const [memory, setMemory] = useState<UserMemoryProfile>(() => {
    const loaded = loadUserMemory(currentUsername);
    const updated = {
      ...(currentUsername === "Guest" ? loaded : mergeGuestMemory(loaded, currentUsername, role)),
      username: currentUsername,
      role,
      interactionCount: loaded.interactionCount + 1,
      lastVisitedAt: Date.now(),
    };
    saveUserMemory(updated);
    return updated;
  });

  const updateMemory = useCallback((update: (profile: UserMemoryProfile) => UserMemoryProfile) => {
    setMemory((previous) => {
      const next = update(previous);
      saveUserMemory(next);
      return next;
    });
  }, []);

  const addInterest = useCallback((interest: string) => {
    updateMemory((prev) => {
      if (prev.interests.includes(interest)) return prev;
      const next = { ...prev, interests: [interest, ...prev.interests].slice(0, 8) };
      return next;
    });
  }, [updateMemory]);

  const addSearch = useCallback((search: string) => {
    if (!search.trim()) return;
    updateMemory((prev) => {
      const filtered = prev.recentSearches.filter((s) => s.toLowerCase() !== search.toLowerCase());
      const next = { ...prev, recentSearches: [search, ...filtered].slice(0, 10) };
      return next;
    });
  }, [updateMemory]);

  const addFavoriteService = useCallback((service: string) => {
    updateMemory((prev) => {
      const isFav = prev.favoriteServices.includes(service);
      const nextServices = isFav
        ? prev.favoriteServices.filter((s) => s !== service)
        : [...prev.favoriteServices, service];
      const next = { ...prev, favoriteServices: nextServices };
      return next;
    });
  }, [updateMemory]);

  const addNote = useCallback((note: string) => {
    if (!note.trim()) return;
    updateMemory((prev) => {
      const next = { ...prev, notes: [note, ...prev.notes].slice(0, 15) };
      return next;
    });
  }, [updateMemory]);

  const addMessage = useCallback((message: Omit<ChatMessage, "id" | "createdAt">) => {
    updateMemory((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { ...message, id: crypto.randomUUID(), createdAt: Date.now() },
      ].slice(-40),
    }));
  }, [updateMemory]);

  const addReminder = useCallback((text: string, dueDate = new Date().toISOString().slice(0, 10)) => {
    if (!text.trim()) return;
    updateMemory((prev) => ({
      ...prev,
      reminders: [
        ...prev.reminders,
        { id: crypto.randomUUID(), text: text.trim(), dueDate, createdAt: Date.now() },
      ].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    }));
  }, [updateMemory]);

  const removeReminder = useCallback((id: string) => {
    updateMemory((prev) => ({ ...prev, reminders: prev.reminders.filter((item) => item.id !== id) }));
  }, [updateMemory]);

  const startWorkflow = useCallback((workflow: string) => {
    updateMemory((prev) => ({
      ...prev,
      workflows: [
        { id: crypto.randomUUID(), workflow, status: "active" as const, createdAt: Date.now() },
        ...prev.workflows,
      ].slice(0, 12),
    }));
  }, [updateMemory]);

  const updatePreferences = useCallback((preferences: Partial<UserMemoryProfile["preferences"]>) => {
    updateMemory((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences },
    }));
  }, [updateMemory]);

  const getPersonalizedGreeting = useCallback(() => {
    const isGuest = memory.username === "Guest" || !isAuthenticated;
    const name = isGuest ? "" : memory.username;
    const count = memory.interactionCount;

    if (count <= 1) {
      return isGuest
        ? "Welcome to RINADS! Tap an app — or just chat with me."
        : `Welcome, ${name}! Your personalized RINADS workspace is ready.`;
    }

    if (count < 5) {
      return isGuest
        ? "Welcome back! What business goal can RINPO help you achieve today?"
        : `Welcome back, ${name}! Your active projects & insights are loaded.`;
    }

    return isGuest
      ? "Great to see you again! Explore digital solutions or chat with RINPO."
      : `Hello ${name}! Ready to automate & accelerate your growth today?`;
  }, [memory.username, memory.interactionCount, isAuthenticated]);

  const getPersonalizedInsight = useCallback(() => {
    const role = memory.role;
    const favs = memory.favoriteServices;

    if (role === "client") {
      return "Client Dashboard: 2 active software deliverables in review. All milestones on track.";
    }
    if (role === "staff") {
      return "Staff Portal: 5 customer inquiries received today. AI lead routing is active.";
    }
    if (favs.includes("AI Automation")) {
      return "Did you know? RINADS AI workflows reduce manual customer response times by up to 75%.";
    }
    if (favs.includes("Digital Marketing")) {
      return "Pro tip: Combining custom SEO architecture with high-conversion ad funnels maximizes ROI.";
    }
    return "Did you know? Rinads helps businesses automate, grow & scale with digital intelligence.";
  }, [memory.role, memory.favoriteServices]);

  const value = useMemo<RinpoMemoryContextValue>(() => ({
    memory,
    addInterest,
    addSearch,
    addFavoriteService,
    addNote,
    addMessage,
    addReminder,
    removeReminder,
    startWorkflow,
    updatePreferences,
    getPersonalizedGreeting,
    getPersonalizedInsight,
  }), [
    memory, addInterest, addSearch, addFavoriteService, addNote, addMessage, addReminder,
    removeReminder, startWorkflow, updatePreferences, getPersonalizedGreeting, getPersonalizedInsight,
  ]);

  return createElement(RinpoMemoryContext.Provider, { value }, children);
}

export function useRinpoMemory() {
  const memory = useContext(RinpoMemoryContext);
  if (!memory) throw new Error("useRinpoMemory must be used within RinpoMemoryProvider");
  return memory;
}
