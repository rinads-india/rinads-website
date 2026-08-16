import Link from "next/link";
import { listCmsPagesAction } from "../../actions/cms";
import { TogglePageStatusButton } from "@/components/cms/TogglePageStatusButton";

export default async function WebsitePagesPage() {
  const result = await listCmsPagesAction();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Website pages</h2>
          <p className="text-sm text-muted-foreground">Manage marketing page content and publish state.</p>
        </div>
        <Link href="/website/seo" className="text-sm font-medium text-rinads-primary hover:underline">
          SEO settings
        </Link>
      </div>

      {!result.ok ? (
        <p className="text-sm text-red-400">{result.error}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {result.pages.map((page) => (
                <tr key={page.id}>
                  <td>{page.title}</td>
                  <td>{page.slug}</td>
                  <td>{page.status}</td>
                  <td>{new Date(page.updatedAt).toLocaleString()}</td>
                  <td className="space-x-3">
                    <Link href={`/website/pages/${page.slug}/edit`} className="text-rinads-primary">
                      Edit
                    </Link>
                    <TogglePageStatusButton slug={page.slug} status={page.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
