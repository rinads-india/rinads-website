"use client";

import { useTransition } from "react";
import { updateCmsPageStatusAction } from "@/app/actions/cms";
import type { SitePageStatus } from "@rinads/cms";

type TogglePageStatusButtonProps = {
  slug: string;
  status: SitePageStatus;
};

export function TogglePageStatusButton({ slug, status }: TogglePageStatusButtonProps) {
  const [pending, startTransition] = useTransition();
  const nextStatus: SitePageStatus = status === "published" ? "draft" : "published";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          void updateCmsPageStatusAction(slug, nextStatus);
        })
      }
      className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      {status === "published" ? "Unpublish" : "Publish"}
    </button>
  );
}
