"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { provisionTenantAction } from "@/app/actions/tenants";
import { VERTICAL_TEMPLATES } from "@rinads/platform";

export default function ProvisionTenantPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await provisionTenantAction({
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      templateKey: String(formData.get("templateKey") ?? "ambady-nursery"),
      planKey: String(formData.get("planKey") ?? "starter"),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/tenants/${result.organizationId}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h2 className="text-2xl font-semibold">Provision tenant</h2>
      <form action={onSubmit} className="card space-y-4">
        <label className="block space-y-1 text-sm">
          <span>Organization name</span>
          <input name="name" required className="w-full rounded border border-white/10 bg-surface-muted px-3 py-2" />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Slug</span>
          <input name="slug" required className="w-full rounded border border-white/10 bg-surface-muted px-3 py-2" />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Vertical template</span>
          <select name="templateKey" className="w-full rounded border border-white/10 bg-surface-muted px-3 py-2">
            {Object.entries(VERTICAL_TEMPLATES).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span>Plan</span>
          <select name="planKey" className="w-full rounded border border-white/10 bg-surface-muted px-3 py-2">
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="platform">Platform</option>
          </select>
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-rinads-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Provisioning…" : "Provision"}
        </button>
      </form>
    </div>
  );
}
