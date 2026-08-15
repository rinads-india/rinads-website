"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listOnboardingTemplatesAction, provisionOrganizationAction } from "@/app/onboarding/actions/onboarding";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [templates, setTemplates] = useState<{ key: string; name: string; description: string }[]>([]);

  useEffect(() => {
    void listOnboardingTemplatesAction().then((result) => {
      if (result.ok) setTemplates(result.templates);
    });
  }, []);

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
      <p className="text-muted-foreground">Pick a vertical template and provision your tenant workspace.</p>
      <form action={onSubmit} className="space-y-4 rounded-xl border border-black/10 bg-white p-6">
        <label className="block space-y-1 text-sm">
          <span>Organization name</span>
          <input name="name" required className="w-full rounded border px-3 py-2" />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Slug</span>
          <input name="slug" required placeholder="my-store" className="w-full rounded border px-3 py-2" />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Vertical template</span>
          <select name="templateKey" className="w-full rounded border px-3 py-2">
            {(templates.length ? templates : [{ key: "ambady-nursery", name: "Ambady Nursery", description: "" }]).map(
              (t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              )
            )}
          </select>
        </label>
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
