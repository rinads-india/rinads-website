import { listCmsMediaAction } from "../../actions/cms";
import { MediaLibrary } from "@/components/cms/MediaLibrary";

export default async function WebsiteMediaPage() {
  const result = await listCmsMediaAction();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Media library</h2>
        <p className="text-sm text-muted-foreground">Register CMS media URLs for OG images and page assets.</p>
      </div>
      {!result.ok ? (
        <p className="text-sm text-red-400">{result.error}</p>
      ) : (
        <MediaLibrary initialRows={result.rows} />
      )}
    </div>
  );
}
