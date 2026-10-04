import Link from "next/link";
import { BlogPostEditor } from "@/components/cms/BlogPostEditor";

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/website/blog" className="text-sm text-rinads-primary hover:underline">
          ← Back to blog
        </Link>
        <h2 className="mt-2 text-2xl font-semibold">New blog post</h2>
        <p className="text-sm text-muted-foreground">
          New posts start as drafts. Publish and preview from the editor after saving.
        </p>
      </div>
      <BlogPostEditor mode="new" />
    </div>
  );
}
