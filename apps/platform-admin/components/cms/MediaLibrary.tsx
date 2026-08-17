"use client";

import { useState, useTransition } from "react";
import { registerCmsMediaAction } from "@/app/actions/cms";
import type { SiteMedia } from "@rinads/cms";

type MediaLibraryProps = {
  initialRows: SiteMedia[];
};

export function MediaLibrary({ initialRows }: MediaLibraryProps) {
  const [rows, setRows] = useState(initialRows);
  const [publicUrl, setPublicUrl] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [altText, setAltText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <form
        className="card grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage(null);
          startTransition(async () => {
            const result = await registerCmsMediaAction({
              storagePath: storagePath || publicUrl,
              publicUrl,
              altText,
              mimeType: "image/png",
            });
            if (!result.ok) {
              setMessage(result.error);
              return;
            }
            setRows((current) => [
              {
                id: `media_${Date.now()}`,
                storagePath: storagePath || publicUrl,
                publicUrl,
                altText,
                mimeType: "image/png",
                createdAt: new Date().toISOString(),
              },
              ...current,
            ]);
            setPublicUrl("");
            setStoragePath("");
            setAltText("");
            setMessage("Media registered.");
          });
        }}
      >
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Public URL</span>
          <input
            value={publicUrl}
            onChange={(event) => setPublicUrl(event.target.value)}
            placeholder="https://www.rinads.com/assets/rinads-logo.png"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Storage path</span>
          <input
            value={storagePath}
            onChange={(event) => setStoragePath(event.target.value)}
            placeholder="rinads-cms/logo.png"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Alt text</span>
          <input
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-rinads-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60 sm:col-span-2 sm:w-fit"
        >
          Register media
        </button>
      </form>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div key={row.id} className="card space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.publicUrl} alt={row.altText} className="h-32 w-full rounded-md object-cover" />
            <p className="truncate text-xs text-muted-foreground">{row.publicUrl}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
