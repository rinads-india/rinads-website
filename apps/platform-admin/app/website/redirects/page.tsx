import { listCmsRedirectsAction } from "../../actions/cms";
import { RedirectManager } from "@/components/cms/RedirectManager";

export default async function WebsiteRedirectsPage() {
  const result = await listCmsRedirectsAction();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Redirects</h2>
        <p className="text-sm text-muted-foreground">Manage marketing site path redirects.</p>
      </div>
      {!result.ok ? (
        <p className="text-sm text-red-400">{result.error}</p>
      ) : (
        <RedirectManager initialRows={result.rows} />
      )}
    </div>
  );
}
