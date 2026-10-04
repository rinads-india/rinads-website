"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveCmsBlogPostAction } from "@/app/actions/cms";
import type { SiteBlogPost } from "@rinads/cms";

type BlogPostEditorProps = {
  mode: "new" | "edit";
  initial?: SiteBlogPost;
};

export function BlogPostEditor({ mode, initial }: BlogPostEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    excerpt: initial?.excerpt ?? "",
    body: initial?.body ?? "",
    tags: (initial?.tags ?? []).join(", "),
    coverImageUrl: initial?.coverImageUrl ?? "",
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
          const result = await saveCmsBlogPostAction({
            slug: form.slug,
            title: form.title,
            excerpt: form.excerpt,
            body: form.body,
            tags: form.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            coverImageUrl: form.coverImageUrl || undefined,
          });
          if (!result.ok) {
            setMessage(result.error);
            return;
          }
          setMessage("Saved.");
          if (mode === "new") {
            router.push(`/website/blog/${result.slug}/edit`);
          } else {
            router.refresh();
          }
        });
      }}
    >
      <label className="block space-y-1">
        <span className="text-sm font-medium">Slug</span>
        <input
          value={form.slug}
          onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
          readOnly={mode === "edit"}
          placeholder={mode === "new" ? "auto-generated from title if blank" : undefined}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm read-only:opacity-60"
        />
      </label>

      {[
        ["title", "Title"],
        ["excerpt", "Excerpt"],
        ["coverImageUrl", "Cover image URL"],
        ["tags", "Tags (comma-separated)"],
      ].map(([key, label]) => (
        <label key={key} className="block space-y-1">
          <span className="text-sm font-medium">{label}</span>
          <input
            value={form[key as keyof typeof form]}
            onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
      ))}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Body</span>
        <textarea
          value={form.body}
          onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
          rows={14}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
        />
        <span className="text-xs text-muted-foreground">
          Plain text. Separate paragraphs with a blank line.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-rinads-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : mode === "new" ? "Create post" : "Save post"}
      </button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
