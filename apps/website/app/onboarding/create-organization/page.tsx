"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { provisionOrganizationAction } from "@/app/onboarding/actions/onboarding";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await provisionOrganizationAction({
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      templateKey: String(formData.get("templateKey") ?? "ambady-nursery"),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/onboarding/provisioning?orgId=${encodeURIComponent(result.organizationId)}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <h1 className="text-3xl font-semibold">Create your organization</h1>
      <p className="text-muted-foreground">
        Set up your tenant workspace. Ambady nursery template is selected by default.
      </p>
      <form action={onSubmit} className="space-y-4 rounded-xl border border-black/10 bg-white p-6">
        <label className="block space-y-1 text-sm">
          <span>Organization name</span>
          <input name="name" required className="w-full rounded border px-3 py-2" />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Slug</span>
          <input name="slug" required placeholder="my-nursery" className="w-full rounded border px-3 py-2" />
        </label>
        <input type="hidden" name="templateKey" value="ambady-nursery" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[#9f4bc7] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create organization"}
        </button>
      </form>
    </div>
  );
}
