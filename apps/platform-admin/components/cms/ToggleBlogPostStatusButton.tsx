"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateCmsBlogPostStatusAction } from "@/app/actions/cms";
import type { SitePageStatus } from "@rinads/cms";

type ToggleBlogPostStatusButtonProps = {
  slug: string;
  status: SitePageStatus;
};

export function ToggleBlogPostStatusButton({ slug, status }: ToggleBlogPostStatusButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const nextStatus: SitePageStatus = status === "published" ? "draft" : "published";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await updateCmsBlogPostStatusAction(slug, nextStatus);
          router.refresh();
        })
      }
      className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      {status === "published" ? "Unpublish" : "Publish"}
    </button>
  );
}
