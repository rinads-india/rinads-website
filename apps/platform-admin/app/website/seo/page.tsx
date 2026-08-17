import Link from "next/link";
import { listCmsSeoAction } from "../../actions/cms";

export default async function WebsiteSeoPage() {
  const result = await listCmsSeoAction();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">SEO settings</h2>
        <p className="text-sm text-muted-foreground">Per-path titles, descriptions, OG tags, and robots rules.</p>
      </div>

      {!result.ok ? (
        <p className="text-sm text-red-400">{result.error}</p>
      ) : (
        <div className="card overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Path</th>
                <th>Title</th>
                <th>Index</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.path}</td>
                  <td>{row.title}</td>
                  <td>{row.robotsIndex ? "yes" : "no"}</td>
                  <td>
                    <Link
                      href={`/website/seo/${encodeURIComponent(row.path.slice(1) || "root")}`}
                      className="text-rinads-primary"
                    >
                      Edit
                    </Link>
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
