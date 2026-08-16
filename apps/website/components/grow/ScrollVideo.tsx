"use client";

import { useEffect, useRef, useState } from "react";

const LERP = 0.12;
const MAX_FRAMES = 90;
const MAX_WIDTH = 960;

type ScrollVideoProps = {
  src: string;
  poster?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ScrollVideo({ src, poster }: ScrollVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCache = useRef<Map<number, ImageBitmap>>(new Map());
  const targetProgress = useRef(0);
  const smoothProgress = useRef(0);
  const rafRef = useRef<number>(0);
  const [loaded, setLoaded] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let cancelled = false;

    const resizeCanvas = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(1, MAX_WIDTH / vw);
      canvas.width = Math.round(vw * scale);
      canvas.height = Math.round(vh * scale);
    };

    const drawCover = (source: CanvasImageSource) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const sw =
        "videoWidth" in source && source.videoWidth
          ? source.videoWidth
          : (source as ImageBitmap).width;
      const sh =
        "videoHeight" in source && source.videoHeight
          ? source.videoHeight
          : (source as ImageBitmap).height;
      if (!sw || !sh) return;

      const scale = Math.max(cw / sw, ch / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(source, dx, dy, dw, dh);
    };

    const cacheFrame = async (time: number) => {
      const key = Math.round(time * 1000);
      if (frameCache.current.has(key)) return frameCache.current.get(key)!;

      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = time;
      });

      if (cancelled) return null;

      const bitmap = await createImageBitmap(video);
      if (frameCache.current.size >= MAX_FRAMES) {
        const firstKey = frameCache.current.keys().next().value;
        if (firstKey !== undefined) {
          frameCache.current.get(firstKey)?.close();
          frameCache.current.delete(firstKey);
        }
      }
      frameCache.current.set(key, bitmap);
      return bitmap;
    };

    const updateTarget = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      targetProgress.current =
        scrollHeight > 0 ? clamp(window.scrollY / scrollHeight, 0, 1) : 0;
    };

    const render = async () => {
      smoothProgress.current +=
        (targetProgress.current - smoothProgress.current) * LERP;

      const duration = video.duration || 0;
      if (duration > 0) {
        const time = smoothProgress.current * duration;
        const key = Math.round(time * 1000);
        let bitmap = frameCache.current.get(key);

        if (!bitmap && loaded) {
          bitmap = (await cacheFrame(time)) ?? undefined;
        }

        if (bitmap) {
          drawCover(bitmap);
          setShowCanvas(true);
        } else if (loaded) {
          video.currentTime = time;
          drawCover(video);
        }
      }

      rafRef.current = requestAnimationFrame(() => {
        void render();
      });
    };

    const onLoaded = () => {
      resizeCanvas();
      setLoaded(true);
      updateTarget();
    };

    const onScroll = () => updateTarget();
    const onResize = () => {
      resizeCanvas();
      frameCache.current.forEach((bitmap) => bitmap.close());
      frameCache.current.clear();
    };

    video.addEventListener("loadedmetadata", onLoaded);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    updateTarget();
    rafRef.current = requestAnimationFrame(() => {
      void render();
    });

    const cache = frameCache.current;

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      video.removeEventListener("loadedmetadata", onLoaded);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cache.forEach((bitmap) => bitmap.close());
      cache.clear();
    };
  }, [loaded]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0a0a0a]">
      {poster ? (
        // Poster is an optional remote fallback before video metadata loads.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            loaded ? "opacity-0" : "opacity-100"
          }`}
        />
      ) : null}
      <video
        ref={videoRef}
        src={src}
        preload="auto"
        muted
        playsInline
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
          showCanvas ? "opacity-0" : loaded ? "opacity-100" : "opacity-0"
        }`}
      />
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
          showCanvas ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
    </div>
  );
}
