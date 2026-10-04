import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  deleteBlogPost,
  getBlogPostBySlug,
  listBlogPosts,
  listPublishedPaths,
  saveBlogPost,
  saveBlogPostStatus,
} from "../src/repository";
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

describe("cms blog post writes (in-memory backend)", () => {
  const baseInput = {
    slug: "a-new-post",
    title: "A new post",
    excerpt: "An excerpt.",
    body: "Body paragraph one.\n\nBody paragraph two.",
    status: "draft" as const,
    tags: ["news"],
  };

  it("creates a new draft that is hidden from the public read path", async () => {
    const saved = await saveBlogPost(null, baseInput);
    assert.equal(saved.slug, "a-new-post");
    assert.equal(saved.status, "draft");
    assert.ok(saved.id);
    assert.equal(await getBlogPostBySlug(null, "a-new-post"), null);
    const withDraft = await getBlogPostBySlug(null, "a-new-post", true);
    assert.equal(withDraft?.title, "A new post");
  });

  it("upserts (updates) an existing post by slug without duplicating", async () => {
    await saveBlogPost(null, baseInput);
    const before = (await listBlogPosts(null, true)).filter((p) => p.slug === "a-new-post").length;
    assert.equal(before, 1);
    await saveBlogPost(null, { ...baseInput, title: "Updated title" });
    const matches = (await listBlogPosts(null, true)).filter((p) => p.slug === "a-new-post");
    assert.equal(matches.length, 1);
    assert.equal(matches[0].title, "Updated title");
  });

  it("publishing sets publishedAt and makes the post public", async () => {
    await saveBlogPost(null, baseInput);
    const published = await saveBlogPostStatus(null, "a-new-post", "published");
    assert.equal(published?.status, "published");
    assert.ok(published?.publishedAt, "publishedAt should be set on publish");
    const publicPost = await getBlogPostBySlug(null, "a-new-post");
    assert.equal(publicPost?.status, "published");
    const paths = (await listPublishedPaths(null)).map((entry) => entry.path);
    assert.ok(paths.includes("/blog/a-new-post"));
  });

  it("unpublishing clears publishedAt and re-hides the post", async () => {
    await saveBlogPost(null, baseInput);
    await saveBlogPostStatus(null, "a-new-post", "published");
    const unpublished = await saveBlogPostStatus(null, "a-new-post", "draft");
    assert.equal(unpublished?.status, "draft");
    assert.equal(unpublished?.publishedAt, undefined);
    assert.equal(await getBlogPostBySlug(null, "a-new-post"), null);
  });

  it("returns null when updating the status of an unknown slug", async () => {
    assert.equal(await saveBlogPostStatus(null, "ghost", "published"), null);
  });

  it("deletes a post by id", async () => {
    const saved = await saveBlogPost(null, baseInput);
    await deleteBlogPost(null, saved.id);
    assert.equal(await getBlogPostBySlug(null, "a-new-post", true), null);
  });
});
