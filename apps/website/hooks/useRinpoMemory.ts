"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type UserMemoryProfile = {
  username: string;
  role: string;
  interests: string[];
  recentSearches: string[];
  favoriteServices: string[];
  notes: string[];
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

export function useRinpoMemory() {
  const { user, isAuthenticated } = useAuth();
  const currentUsername = isAuthenticated && user?.username ? user.username : "Guest";

  const [memory, setMemory] = useState<UserMemoryProfile>(() => {
    const loaded = loadUserMemory(currentUsername);
    const updated = {
      ...loaded,
      role: isAuthenticated && user?.role ? user.role : "visitor",
      interactionCount: loaded.interactionCount + 1,
      lastVisitedAt: Date.now(),
    };
    saveUserMemory(updated);
    return updated;
  });

  const addInterest = useCallback((interest: string) => {
    setMemory((prev) => {
      if (prev.interests.includes(interest)) return prev;
      const next = { ...prev, interests: [interest, ...prev.interests].slice(0, 8) };
      saveUserMemory(next);
      return next;
    });
  }, []);

  const addSearch = useCallback((search: string) => {
    if (!search.trim()) return;
    setMemory((prev) => {
      const filtered = prev.recentSearches.filter((s) => s.toLowerCase() !== search.toLowerCase());
      const next = { ...prev, recentSearches: [search, ...filtered].slice(0, 10) };
      saveUserMemory(next);
      return next;
    });
  }, []);

  const addFavoriteService = useCallback((service: string) => {
    setMemory((prev) => {
      const isFav = prev.favoriteServices.includes(service);
      const nextServices = isFav
        ? prev.favoriteServices.filter((s) => s !== service)
        : [...prev.favoriteServices, service];
      const next = { ...prev, favoriteServices: nextServices };
      saveUserMemory(next);
      return next;
    });
  }, []);

  const addNote = useCallback((note: string) => {
    if (!note.trim()) return;
    setMemory((prev) => {
      const next = { ...prev, notes: [note, ...prev.notes].slice(0, 15) };
      saveUserMemory(next);
      return next;
    });
  }, []);

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

  return {
    memory,
    addInterest,
    addSearch,
    addFavoriteService,
    addNote,
    getPersonalizedGreeting,
    getPersonalizedInsight,
  };
}
