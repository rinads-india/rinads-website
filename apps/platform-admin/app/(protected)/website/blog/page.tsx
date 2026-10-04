import Link from "next/link";
import { listCmsBlogPostsAction } from "@/app/actions/cms";
import { ToggleBlogPostStatusButton } from "@/components/cms/ToggleBlogPostStatusButton";

export default async function WebsiteBlogPage() {
  const result = await listCmsBlogPostsAction();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Blog posts</h2>
          <p className="text-sm text-muted-foreground">Author marketing blog posts and manage publish state.</p>
        </div>
        <Link
          href="/website/blog/new"
          className="rounded-md bg-rinads-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          New post
        </Link>
      </div>

      {!result.ok ? (
        <p className="text-sm text-red-400">{result.error}</p>
      ) : result.posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No posts yet. Create your first post.</p>
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
              {result.posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>{post.slug}</td>
                  <td>{post.status}</td>
                  <td>{new Date(post.updatedAt).toLocaleString()}</td>
                  <td className="space-x-3">
                    <Link href={`/website/blog/${post.slug}/edit`} className="text-rinads-primary">
                      Edit
                    </Link>
                    <ToggleBlogPostStatusButton slug={post.slug} status={post.status} />
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
