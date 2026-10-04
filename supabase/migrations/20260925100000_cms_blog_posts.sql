-- Marketing site blog posts (platform-global, not org-scoped). Mirrors the
-- site_pages access model: public can read published rows; privileged platform
-- users (founder / super_admin) manage all rows. Drafts are never public and
-- are previewed via signed, path-scoped preview tokens at the application layer.

CREATE TABLE IF NOT EXISTS public.site_blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  cover_image_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_blog_posts_status_published_at_idx
  ON public.site_blog_posts (status, published_at DESC);

ALTER TABLE public.site_blog_posts ENABLE ROW LEVEL SECURITY;

-- Public read: published posts only.
CREATE POLICY site_blog_posts_public_select ON public.site_blog_posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Privileged platform users manage all posts (incl. drafts).
CREATE POLICY site_blog_posts_privileged_all ON public.site_blog_posts
  FOR ALL TO authenticated
  USING (private.is_platform_privileged_user())
  WITH CHECK (private.is_platform_privileged_user());

-- Seed a published post and a draft (draft stays private; preview via token).
INSERT INTO public.site_blog_posts (slug, title, excerpt, body, status, tags, published_at) VALUES
  (
    'operating-platform-not-another-tool',
    'Why RINADS is an operating platform, not another tool',
    'Most teams drown in disconnected apps. RINADS connects run, build, grow, learn, and automate into one operating layer.',
    E'Fragmented software is the default state of most growing businesses: a CRM here, a project tool there, a storefront somewhere else, and spreadsheets stitching it together.\n\nRINADS takes a different position. Instead of adding one more tool, it provides a single operating layer where customers, work, money, growth, and automation share one data model and one intelligence layer.\n\nRINPO is the interface, RINADS Intelligence is the brain, and the platform is the operating system that keeps them connected.',
    'published',
    ARRAY['platform', 'vision'],
    now()
  ),
  (
    'rinpo-grounded-business-actions',
    'How RINPO turns business data into grounded actions',
    'RINPO does not guess. It grounds every suggestion in your real business data and routes sensitive actions through approvals.',
    E'An AI assistant is only useful inside a business when it is grounded in that business''s real data and governed by its real permissions.\n\nRINPO reads from the same governed data model as the rest of RINADS, proposes actions, and funnels anything sensitive — like sending a customer message — through an explicit approval step.\n\nThis post walks through the appointment-confirmation flow as a concrete example of grounded, approval-gated automation.',
    'draft',
    ARRAY['rinpo', 'intelligence'],
    NULL
  )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.site_seo (path, title, description, og_title, og_description, robots_index, robots_follow) VALUES
  ('/blog', 'Blog | RINADS', 'Product thinking, platform updates, and operating-model notes from the team building RINADS.', 'Blog | RINADS', 'Product thinking and platform updates from the team building RINADS.', true, true)
ON CONFLICT (path) DO NOTHING;
