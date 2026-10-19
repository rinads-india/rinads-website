"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";
import { ArrowRight, Download, Globe2, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRinpo } from "@/components/rinpo/RinpoProvider";
import type { PhoneScreenId } from "@/components/rinpo/RinpoPhoneScreens";

const ALLOWED_ENTRY_SCREENS = new Set<PhoneScreenId>([
  "today",
  "ask",
  "work",
  "world",
  "apps",
  "settings",
]);

function readInitialScreen(): PhoneScreenId {
  if (typeof window === "undefined") return "apps";
  const requested = new URL(window.location.href).searchParams.get("screen") as PhoneScreenId | null;
  return requested && ALLOWED_ENTRY_SCREENS.has(requested) ? requested : "apps";
}

export function PhoneAppClient() {
  const { user, isAuthenticated } = useAuth();
  const {
    phoneOpen,
    openPhoneScreen,
    setLoginModalMode,
    setLoginModalOpen,
  } = useRinpo();

  const displayName = useMemo(
    () => user?.displayName || user?.username || user?.email?.split("@")[0] || "Guest",
    [user],
  );

  const launchPhone = useCallback(() => {
    openPhoneScreen(readInitialScreen());
  }, [openPhoneScreen]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/rinpo-phone-sw.js", { scope: "/phone" }).catch(() => {
        // PWA registration is progressive enhancement. The authenticated web app still works without it.
      });
    }

    const timer = window.setTimeout(() => launchPhone(), 0);
    return () => window.clearTimeout(timer);
  }, [launchPhone]);

  return (
    <main
      id="main"
      className="relative min-h-[100svh] overflow-hidden bg-[#0B0B0B] text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-purple-700/20 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(159,75,199,0.18),transparent_42%)]" />
      </div>

      <section className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] md:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="RINADS home" className="inline-flex items-center gap-3">
            <Image
              src="/assets/rinads-logo.png"
              alt="RINADS"
              width={132}
              height={44}
              priority
              className="h-auto w-28 object-contain brightness-0 invert md:w-32"
            />
          </Link>
          <div className="rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-purple-200">
            Web App Alpha
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/65">
              <Smartphone size={14} className="text-purple-300" />
              RINPO Phone · installable web experience
            </div>

            <h1 className="mt-6 text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-7xl">
              Your RINADS workspace,
              <span className="block bg-gradient-to-r from-[#C08AE0] to-[#9F4BC7] bg-clip-text text-transparent">
                one intelligent interface.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/60 md:text-base">
              This alpha packages the existing governed RINPO Phone experience as a standalone web app. It does not replace iOS, Android, macOS or Windows, and it does not claim native dialer, offline business data or cross-device memory yet.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={launchPhone}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#9F4BC7] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-950/40 transition hover:bg-[#ad5ed0]"
              >
                {phoneOpen ? "Return to RINPO Phone" : "Open RINPO Phone"}
                <ArrowRight size={16} />
              </button>

              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setLoginModalMode("login");
                    setLoginModalOpen(true);
                  }}
                  className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/10"
                >
                  <LockKeyhole size={16} />
                  Sign in
                </button>
              ) : (
                <div className="inline-flex min-h-12 items-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-100">
                  Signed in as {displayName}
                </div>
              )}
            </div>

            <div className="mt-7 grid max-w-xl gap-2.5 sm:grid-cols-3">
              {[
                [ShieldCheck, "Server + RLS authorization"],
                [Globe2, "RINADS WORLD bridge"],
                [Download, "Add to Home Screen"],
              ].map(([Icon, label]) => {
                const FeatureIcon = Icon as typeof ShieldCheck;
                return (
                  <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
                    <FeatureIcon size={15} className="text-purple-300" />
                    <p className="mt-2 text-[11px] font-semibold leading-4 text-white/70">{String(label)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-8 rounded-full bg-purple-600/15 blur-3xl" />
            <div className="relative rounded-[2.2rem] border border-purple-400/25 bg-gradient-to-b from-[#21102f] to-[#0d0614] p-5 shadow-2xl shadow-black/60">
              <div className="rounded-[1.65rem] border border-white/10 bg-black/35 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-300">RINPO PHONE</p>
                    <p className="mt-1 text-lg font-black">Business Simplified.</p>
                  </div>
                  <div className="h-10 w-10 overflow-hidden rounded-full border border-purple-400/30 bg-purple-950/40">
                    <Image
                      src="/assets/rinpo-full-body-transparent-v2.png"
                      alt="RINPO"
                      width={48}
                      height={48}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  {["Today", "RINPO", "Work", "World", "Apps", "Settings"].map((label) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-4">
                      <div className="h-7 w-7 rounded-xl bg-purple-500/20" />
                      <p className="mt-3 text-xs font-bold text-white/80">{label}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-5 rounded-2xl border border-purple-400/20 bg-purple-500/10 p-3 text-[10px] leading-5 text-purple-100/75">
                  Installability is progressive enhancement. Sensitive business actions remain governed by the existing RINADS server, permission and approval paths.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-[10px] text-white/35">
          <span>RINPO Phone Web Alpha · RINADS Technologies</span>
          <Link href="/trust/privacy" className="transition hover:text-white/70">
            Privacy
          </Link>
        </footer>
      </section>
    </main>
  );
}
