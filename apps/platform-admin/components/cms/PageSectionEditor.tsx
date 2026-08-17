"use client";

import { useState, useTransition } from "react";
import { saveCmsPageSectionAction } from "@/app/actions/cms";

type PageSectionEditorProps = {
  slug: string;
  sectionKey: string;
  initialJson: string;
};

export function PageSectionEditor({ slug, sectionKey, initialJson }: PageSectionEditorProps) {
  const [json, setJson] = useState(initialJson);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await saveCmsPageSectionAction(slug, sectionKey, json);
          setMessage(result.ok ? "Saved." : result.error);
        });
      }}
    >
      <label className="block space-y-1">
        <span className="text-sm font-medium">{sectionKey}</span>
        <textarea
          value={json}
          onChange={(event) => setJson(event.target.value)}
          rows={16}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-rinads-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save section"}
        </button>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
    </form>
  );
}
