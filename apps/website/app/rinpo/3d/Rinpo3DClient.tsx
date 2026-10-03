"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MarketingPageShell } from "@/components/system";
import { RinpoUnityPlayer } from "@/components/rinpo/RinpoUnityPlayer";
import { useRinpo } from "@/components/rinpo/RinpoProvider";

type PublicUnityAction = "OPEN_RINPO" | "SHOW_BUSINESS_OS" | "BOOK_DEMO";

export function Rinpo3DClient() {
  const [started, setStarted] = useState(false);
  const router = useRouter();
  const { openPhoneScreen } = useRinpo();

  useEffect(() => {
    function onUnityAction(event: Event) {
      if (!(event instanceof CustomEvent)) return;
      const action = (event.detail as { action?: unknown } | null)?.action;
      if (typeof action !== "string") return;
      const allowed: PublicUnityAction[] = ["OPEN_RINPO", "SHOW_BUSINESS_OS", "BOOK_DEMO"];
      if (!allowed.some((value) => value === action)) return;
      // Unity can request only these public, non-mutating UI actions.
      // It cannot send arbitrary chat prompts, auth context, or tenant data.
      if (action === "OPEN_RINPO") {
        openPhoneScreen("chat");
      } else if (action === "SHOW_BUSINESS_OS") {
        router.push("/platform/business-os");
      } else if (action === "BOOK_DEMO") {
        router.push("/contact?intent=demo");
      }
    }

    window.addEventListener("rinads:unity:action", onUnityAction);
    return () => window.removeEventListener("rinads:unity:action", onUnityAction);
  }, [openPhoneScreen, router]);

  return (
    <MarketingPageShell>
      <section id="rinpo-unity-experience" className="px-6 pb-20 pt-16 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rinads-primary">
            RINPO · OPTIONAL 3D PREVIEW
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold text-[var(--text-primary)] md:text-5xl">
            Explore RINPO in 3D.
          </h1>
          <p className="mt-4 max-w-2xl text-[var(--text-muted)]">
            Choose the interactive experience when available, or use RINPO directly.
            Your existing RINADS experience works without a Unity download.
          </p>

          <div className="mt-9">
            {started ? (
              <RinpoUnityPlayer onClose={() => setStarted(false)} />
            ) : (
              <div className="grid overflow-hidden rounded-3xl border border-rinads-primary/25 bg-[#10081c] md:grid-cols-2">
                <div className="flex min-h-[300px] items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(137,74,207,.2),transparent_70%)] p-8">
                  <Image
                    src="/assets/rinpo-full-body-transparent-v2.png"
                    alt="Approved existing RINPO character illustration"
                    width={280}
                    height={370}
                    priority
                    className="max-h-[370px] w-auto object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center gap-5 p-8 text-white">
                  <h2 className="text-2xl font-bold">Meet the same RINPO, across every channel.</h2>
                  <p className="text-sm leading-6 text-white/75">
                    This optional scene is being developed around the approved RINPO identity.
                    The existing RINPO phone remains available throughout.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStarted(true)}
                    className="rounded-full bg-rinads-primary px-6 py-3 text-sm font-bold text-white"
                  >
                    Launch optional 3D experience
                  </button>
                  <button
                    type="button"
                    onClick={() => openPhoneScreen("chat")}
                    className="rounded-full border border-white/35 px-6 py-3 text-sm font-semibold text-white"
                  >
                    Talk to RINPO now
                  </button>
                </div>
              </div>
            )}
          </div>
          <nav aria-label="RINPO experience alternatives" className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-rinads-primary">
            <Link href="/rinpo">RINPO overview →</Link>
            <Link href="/platform/business-os">Business OS →</Link>
            <Link href="/contact?intent=demo">Book a demonstration →</Link>
          </nav>
        </div>
      </section>
    </MarketingPageShell>
  );
}
