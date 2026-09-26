"use client";

import { useEffect, useRef, useState } from "react";
import { parseRinpoUnityManifest, resolveRinpoUnityBaseUrl } from "@/lib/rinpo-unity";

type UnityInstance = { Quit: () => Promise<void> };
type CreateUnityInstance = (
  canvas: HTMLCanvasElement,
  config: {
    dataUrl: string;
    frameworkUrl: string;
    codeUrl: string;
    streamingAssetsUrl: string;
    companyName: string;
    productName: string;
    productVersion: string;
  },
  progress: (value: number) => void,
) => Promise<UnityInstance>;

type UnityBrowserWindow = Window & {
  createUnityInstance?: CreateUnityInstance;
};

export function RinpoUnityPlayer({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const instanceRef = useRef<UnityInstance | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    let script: HTMLScriptElement | null = null;

    async function load() {
      try {
        const canvas = canvasRef.current;
        if (!canvas || !("WebAssembly" in window) || !canvas.getContext("webgl2")) {
          throw new Error("Unity Web requires WebAssembly and WebGL 2.");
        }
        const baseUrl = resolveRinpoUnityBaseUrl(
          process.env.NEXT_PUBLIC_RINPO_UNITY_BASE_URL || "/unity/rinpo/v1",
          window.location.origin,
        );
        if (!baseUrl) throw new Error("Unapproved Unity asset base URL.");

        const response = await fetch(baseUrl + "/manifest.json", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("The versioned Unity build is not published.");
        const manifest = parseRinpoUnityManifest(await response.json());
        if (!manifest) throw new Error("Invalid Unity asset manifest.");
        if (disposed) return;

        const loader = document.createElement("script");
        script = loader;
        loader.async = true;
        loader.src = baseUrl + "/" + manifest.loader;
        await new Promise<void>((resolve, reject) => {
          loader.onload = () => resolve();
          loader.onerror = () => reject(new Error("Unity loader failed."));
          document.head.appendChild(loader);
        });
        if (disposed) return;

        const create = (window as UnityBrowserWindow).createUnityInstance;
        if (typeof create !== "function") throw new Error("Unity instance factory missing.");
        const instance = await create(
          canvas,
          {
            dataUrl: baseUrl + "/" + manifest.data,
            frameworkUrl: baseUrl + "/" + manifest.framework,
            codeUrl: baseUrl + "/" + manifest.code,
            streamingAssetsUrl: baseUrl + "/StreamingAssets",
            companyName: "RINADS Technologies",
            productName: "RINPO 3D",
            productVersion: manifest.version,
          },
          (value) => { if (!disposed) setProgress(Math.round(value * 100)); },
        );
        if (disposed) {
          void instance.Quit().catch(() => {});
          return;
        }
        instanceRef.current = instance;
        setStatus("ready");
      } catch {
        if (!disposed) setStatus("unavailable");
      }
    }

    void load();
    return () => {
      disposed = true;
      controller.abort();
      if (script) script.remove();
      const instance = instanceRef.current;
      instanceRef.current = null;
      if (instance) void instance.Quit().catch(() => {});
    };
  }, []);

  return (
    <section
      aria-label="Optional RINPO Unity Web experience"
      className="relative overflow-hidden rounded-3xl border border-rinads-primary/30 bg-[#0c0617]"
    >
      <canvas
        ref={canvasRef}
        aria-label="Interactive RINPO 3D scene"
        className="block h-[min(65vh,580px)] min-h-[300px] w-full touch-none"
      />
      {status !== "ready" && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0c0617] p-8 text-center text-white"
        >
          {status === "loading" ? (
            <>
              <p className="text-lg font-semibold">Loading RINPO 3D</p>
              <progress aria-label="Loading Unity" value={progress} max={100} className="w-48" />
              <p className="text-sm text-white/70">{progress}%</p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">The optional 3D scene is unavailable.</p>
              <p className="max-w-md text-sm text-white/75">
                You can still explore RINADS and speak to the existing RINPO assistant.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-rinads-primary px-5 py-2 font-semibold text-white"
              >
                Return to RINPO
              </button>
            </>
          )}
        </div>
      )}
      {status === "ready" && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-black/80 px-4 py-2 text-sm font-semibold text-white"
        >
          Close 3D experience
        </button>
      )}
    </section>
  );
}
