import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { getBlogPostBySlug, listBlogPosts, listPublishedPaths } from "../src/repository";
import { resetCmsStore } from "../src/memory";

afterEach(() => {
  resetCmsStore();
});

describe("cms blog posts (in-memory backend)", () => {
  it("lists only published posts by default", async () => {
    const posts = await listBlogPosts(null);
    assert.ok(posts.length >= 1);
    assert.ok(posts.every((post) => post.status === "published"));
  });

  it("includes drafts when explicitly requested", async () => {
    const published = await listBlogPosts(null, false);
    const all = await listBlogPosts(null, true);
    assert.ok(all.length > published.length);
    assert.ok(all.some((post) => post.status === "draft"));
  });

  it("sorts posts newest-first by publish/update time", async () => {
    const all = await listBlogPosts(null, true);
    for (let i = 1; i < all.length; i += 1) {
      const prev = all[i - 1].publishedAt ?? all[i - 1].updatedAt;
      const curr = all[i].publishedAt ?? all[i].updatedAt;
      assert.ok(prev >= curr, "posts should be in descending chronological order");
    }
  });

  it("hides a draft from getBlogPostBySlug unless drafts are included", async () => {
    const draftSlug = "rinpo-grounded-business-actions";
    assert.equal(await getBlogPostBySlug(null, draftSlug), null);
    const withDraft = await getBlogPostBySlug(null, draftSlug, true);
    assert.ok(withDraft);
    assert.equal(withDraft?.status, "draft");
  });

  it("returns a published post by slug without draft access", async () => {
    const slug = "operating-platform-not-another-tool";
    const post = await getBlogPostBySlug(null, slug);
    assert.ok(post);
    assert.equal(post?.slug, slug);
    assert.equal(post?.status, "published");
    assert.ok(Array.isArray(post?.tags));
  });

  it("returns null for an unknown slug", async () => {
    assert.equal(await getBlogPostBySlug(null, "does-not-exist", true), null);
  });

  it("adds published blog paths to the sitemap and excludes drafts", async () => {
    const paths = (await listPublishedPaths(null)).map((entry) => entry.path);
    assert.ok(paths.includes("/blog/operating-platform-not-another-tool"));
    assert.ok(!paths.includes("/blog/rinpo-grounded-business-actions"));
  });
});
