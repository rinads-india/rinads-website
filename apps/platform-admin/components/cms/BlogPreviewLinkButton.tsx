"use client";

import { useState, useTransition } from "react";
import { createCmsBlogPreviewLinkAction } from "@/app/actions/cms";

type BlogPreviewLinkButtonProps = {
  slug: string;
};

export function BlogPreviewLinkButton({ slug }: BlogPreviewLinkButtonProps) {
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setMessage(null);
            const result = await createCmsBlogPreviewLinkAction(slug);
            if (!result.ok) {
              setUrl(null);
              setMessage(result.error);
              return;
            }
            setUrl(result.url);
            try {
              await navigator.clipboard.writeText(result.url);
              setMessage("Preview link copied to clipboard.");
            } catch {
              setMessage("Preview link generated (copy it below).");
            }
          })
        }
        className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-rinads-primary disabled:opacity-60"
      >
        {pending ? "Generating…" : "Copy preview link"}
      </button>
      {url ? (
        <p className="break-all text-xs text-muted-foreground">
          <a href={url} target="_blank" rel="noreferrer" className="text-rinads-primary hover:underline">
            {url}
          </a>
        </p>
      ) : null}
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
