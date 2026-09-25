import Link from "next/link";
import { listTemplatesAction } from "@/app/actions/templates";

export default async function TemplatesPage() {
  const result = await listTemplatesAction();
  if (!result.ok) {
    return <p className="text-red-400">{result.error}</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Vertical marketplace</h2>
      <p className="text-sm text-muted-foreground">
        Published templates available for tenant provisioning.
      </p>
      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Key</th>
              <th>Name</th>
              <th>Category</th>
              <th>Published</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {result.templates.map((t) => (
              <tr key={t.key}>
                <td>{t.key}</td>
                <td>{t.name}</td>
                <td>{t.category}</td>
                <td>{t.isPublished ? "Yes" : "No"}</td>
                <td>
                  <Link href={`/templates/${t.key}`} className="text-rinads-primary text-sm">
                    Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
