"use client";

import { useState, useTransition } from "react";
import { saveCmsSeoAction } from "@/app/actions/cms";
import type { SiteSeo } from "@rinads/cms";

type SeoEditorFormProps = {
  initial: SiteSeo;
};

export function SeoEditorForm({ initial }: SeoEditorFormProps) {
  const [form, setForm] = useState({
    path: initial.path,
    title: initial.title,
    description: initial.description,
    ogTitle: initial.ogTitle ?? "",
    ogDescription: initial.ogDescription ?? "",
    ogImageUrl: initial.ogImageUrl ?? "",
    canonicalUrl: initial.canonicalUrl ?? "",
    robotsIndex: initial.robotsIndex,
    robotsFollow: initial.robotsFollow,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="card space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage(null);
        startTransition(async () => {
          const result = await saveCmsSeoAction({
            ...form,
            ogTitle: form.ogTitle || undefined,
            ogDescription: form.ogDescription || undefined,
            ogImageUrl: form.ogImageUrl || undefined,
            canonicalUrl: form.canonicalUrl || undefined,
          });
          setMessage(result.ok ? "Saved." : result.error);
        });
      }}
    >
      {[
        ["title", "Title"],
        ["description", "Description"],
        ["ogTitle", "OG title"],
        ["ogDescription", "OG description"],
        ["ogImageUrl", "OG image URL"],
        ["canonicalUrl", "Canonical URL"],
      ].map(([key, label]) => (
        <label key={key} className="block space-y-1">
          <span className="text-sm font-medium">{label}</span>
          <input
            value={form[key as keyof typeof form] as string}
            onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          {key === "title" || key === "description" ? (
            <span className="text-xs text-muted-foreground">
              {(form[key as keyof typeof form] as string).length} chars
            </span>
          ) : null}
        </label>
      ))}

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.robotsIndex}
            onChange={(event) => setForm((current) => ({ ...current, robotsIndex: event.target.checked }))}
          />
          Index
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.robotsFollow}
            onChange={(event) => setForm((current) => ({ ...current, robotsFollow: event.target.checked }))}
          />
          Follow
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-rinads-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save SEO"}
      </button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
