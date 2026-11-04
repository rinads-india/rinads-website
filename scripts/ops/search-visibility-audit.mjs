#!/usr/bin/env node
/**
 * Read-only public SEO smoke audit for RINADS. No Google account access.
 * Usage: node scripts/ops/search-visibility-audit.mjs
 * Optional: RINADS_SITE_URL=https://www.rinads.com node scripts/ops/search-visibility-audit.mjs
 * Intentionally limited to owned RINADS domains to prevent accidental scanning of third parties.
 */
const input = process.env.RINADS_SITE_URL ?? "https://www.rinads.com";
const base = new URL(input);
if (base.protocol !== "https:" || !["www.rinads.com", "rinads.com"].includes(base.hostname)) {
  throw new Error("Only public HTTPS rinads.com hosts may be audited");
}
const paths = ["/", "/platform/growth", "/solutions/salon", "/solutions/landscape", "/grow/search-intelligence"];

function attribute(tag, name) {
  const re = new RegExp("\\b" + name + "\\s*=\\s*([\\\"'])((?:(?!\\1).)*)\\1", "i");
  return tag.match(re)?.[2] ?? null;
}
function byAttribute(html, element, key, value, desired) {
  const tags = html.match(new RegExp("<" + element + "\\b[^>]*>", "gi")) ?? [];
  const found = tags.find((tag) => (attribute(tag, key) ?? "").toLowerCase() === value.toLowerCase());
  return found ? attribute(found, desired) : null;
}
async function read(path) {
  const res = await fetch(new URL(path, base), {
    headers: { "user-agent": "RINADS-public-search-smoke/1.0" },
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
  });
  const text = (await res.text()).slice(0, 2000000);
  return { status: res.status, url: res.url, text };
}
async function inspect(path) {
  try {
    const r = await read(path);
    const title = r.text.match(/<title[^>]*>([\\s\\S]*?)<\\/title>/i)?.[1]?.trim() ?? null;
    const description = byAttribute(r.text, "meta", "name", "description", "content");
    const canonical = byAttribute(r.text, "link", "rel", "canonical", "href");
    const robots = byAttribute(r.text, "meta", "name", "robots", "content");
    const h1 = (r.text.match(/<h1\\b/gi) ?? []).length;
    const structuredData = /<script[^>]*type=["']application\\/ld\\+json["']/i.test(r.text);
    const issues = [];
    if (r.status !== 200) issues.push("HTTP " + r.status);
    if (!title) issues.push("title not found in initial HTML");
    if (!description) issues.push("meta description not found in initial HTML");
    if (!canonical) issues.push("canonical link not found in initial HTML");
    if (robots && /noindex/i.test(robots)) issues.push("noindex in initial HTML");
    return { path, url: r.url, status: r.status, title, description, canonical, robots, h1Count: h1, structuredData, issues };
  } catch (error) {
    return { path, error: error instanceof Error ? error.message : String(error), issues: ["Fetch failed"] };
  }
}
const [robots, sitemap, ...pages] = await Promise.all([
  read("/robots.txt").catch((e) => ({ status: null, text: "", error: String(e) })),
  read("/sitemap.xml").catch((e) => ({ status: null, text: "", error: String(e) })),
  ...paths.map(inspect),
]);
const report = {
  generatedAt: new Date().toISOString(),
  site: base.origin,
  note: "Read-only initial-HTML smoke check; not indexing, ranking, or Search Console evidence",
  robots: { status: robots.status, declaresSitemap: /^sitemap:/im.test(robots.text), error: robots.error ?? null },
  sitemap: {
    status: sitemap.status,
    pagesReferenced: Object.fromEntries(paths.map((path) => [path, sitemap.text.includes(base.origin + (path === "/" ? "" : path))])),
    error: sitemap.error ?? null,
  },
  pages,
};
process.stdout.write(JSON.stringify(report, null, 2) + "\n");
if (pages.some((page) => page.issues.length > 0) || robots.status !== 200 || sitemap.status !== 200) process.exitCode = 1;
