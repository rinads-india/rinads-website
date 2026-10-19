"use client";

import { useState, useTransition } from "react";
import { registerCmsMediaAction, uploadCmsMediaAction } from "@/app/actions/cms";
import type { SiteMedia } from "@rinads/cms";

type MediaLibraryProps = {
  initialRows: SiteMedia[];
};

export function MediaLibrary({ initialRows }: MediaLibraryProps) {
  const [rows, setRows] = useState(initialRows);
  const [publicUrl, setPublicUrl] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [altText, setAltText] = useState("");
  const [uploadAltText, setUploadAltText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <form
        className="card grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!file) {
            setMessage("Choose an image file to upload.");
            return;
          }
          setMessage(null);
          const body = new FormData();
          body.set("file", file);
          body.set("altText", uploadAltText);
          startTransition(async () => {
            const result = await uploadCmsMediaAction(body);
            if (!result.ok) {
              setMessage(result.error);
              return;
            }
            setRows((current) => [result.row, ...current]);
            setFile(null);
            setFileInputKey((key) => key + 1);
            setUploadAltText("");
            setMessage(
              result.demoFallback
                ? "Uploaded in demo mode (data-URL fallback — apply the Storage migration for live uploads)."
                : "Media uploaded.",
            );
          });
        }}
      >
        <div className="sm:col-span-2">
          <h3 className="text-sm font-semibold">Upload file</h3>
          <p className="text-xs text-muted-foreground">
            PNG, JPEG, WebP, GIF, or SVG up to 5 MB. Live uploads go to the `rinads-cms` Storage bucket.
          </p>
        </div>
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Image file</span>
          <input
            key={fileInputKey}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-rinads-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
          />
        </label>
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Alt text</span>
          <input
            value={uploadAltText}
            onChange={(event) => setUploadAltText(event.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder="Describe the image for accessibility"
          />
        </label>
        <button
          type="submit"
          disabled={pending || !file}
          className="rounded-md bg-rinads-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60 sm:col-span-2 sm:w-fit"
        >
          {pending ? "Uploading…" : "Upload media"}
        </button>
      </form>

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
            setRows((current) => [result.row, ...current]);
            setPublicUrl("");
            setStoragePath("");
            setAltText("");
            setMessage("Media registered.");
          });
        }}
      >
        <div className="sm:col-span-2">
          <h3 className="text-sm font-semibold">Register existing URL</h3>
          <p className="text-xs text-muted-foreground">
            Optional fallback when the asset already lives on a CDN or public path.
          </p>
        </div>
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
          className="rounded-md border border-border px-4 py-2 text-sm font-medium disabled:opacity-60 sm:col-span-2 sm:w-fit"
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
            <p className="truncate text-xs text-muted-foreground">{row.storagePath}</p>
            <p className="truncate text-xs text-muted-foreground">{row.publicUrl}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
