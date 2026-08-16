-- Marketing site CMS + SEO tables (platform-global, not org-scoped)

CREATE TABLE IF NOT EXISTS public.site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  layout_key TEXT NOT NULL DEFAULT 'default',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.site_pages(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_id, section_key)
);

CREATE INDEX IF NOT EXISTS site_page_sections_page_id_idx ON public.site_page_sections(page_id);

CREATE TABLE IF NOT EXISTS public.site_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  robots_index BOOLEAN NOT NULL DEFAULT true,
  robots_follow BOOLEAN NOT NULL DEFAULT true,
  canonical_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  permanent BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL DEFAULT 'image/png',
  width INT,
  height INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Privileged CMS writers (founder / super_admin memberships)
CREATE OR REPLACE FUNCTION private.is_platform_privileged_user()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.user_id = auth.uid()
      AND m.status = 'active'
      AND private.is_privileged_role_key(r.key)
  );
$$;

REVOKE ALL ON FUNCTION private.is_platform_privileged_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_platform_privileged_user() TO authenticated;

ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_media ENABLE ROW LEVEL SECURITY;

-- Public read: published pages
CREATE POLICY site_pages_public_select ON public.site_pages
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY site_pages_privileged_all ON public.site_pages
  FOR ALL TO authenticated
  USING (private.is_platform_privileged_user())
  WITH CHECK (private.is_platform_privileged_user());

-- Sections readable when parent page is published
CREATE POLICY site_page_sections_public_select ON public.site_page_sections
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.site_pages p
      WHERE p.id = page_id AND p.status = 'published'
    )
  );

CREATE POLICY site_page_sections_privileged_all ON public.site_page_sections
  FOR ALL TO authenticated
  USING (private.is_platform_privileged_user())
  WITH CHECK (private.is_platform_privileged_user());

-- SEO, redirects, media: public read
CREATE POLICY site_seo_public_select ON public.site_seo
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY site_seo_privileged_all ON public.site_seo
  FOR ALL TO authenticated
  USING (private.is_platform_privileged_user())
  WITH CHECK (private.is_platform_privileged_user());

CREATE POLICY site_redirects_public_select ON public.site_redirects
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY site_redirects_privileged_all ON public.site_redirects
  FOR ALL TO authenticated
  USING (private.is_platform_privileged_user())
  WITH CHECK (private.is_platform_privileged_user());

CREATE POLICY site_media_public_select ON public.site_media
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY site_media_privileged_all ON public.site_media
  FOR ALL TO authenticated
  USING (private.is_platform_privileged_user())
  WITH CHECK (private.is_platform_privileged_user());

INSERT INTO permissions (key, description) VALUES
  ('platform.cms.read', 'Read marketing CMS content'),
  ('platform.cms.write', 'Manage marketing CMS content')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.key IN ('platform.cms.read', 'platform.cms.write')
WHERE r.key IN ('founder', 'super_admin')
ON CONFLICT DO NOTHING;

-- Seed pages
INSERT INTO public.site_pages (slug, title, layout_key, status) VALUES
  ('home', 'RINADS Home', 'marketing', 'published'),
  ('grow', 'RINADS Grow', 'grow', 'published'),
  ('projects', 'Start a Project', 'projects', 'published'),
  ('rinpo-story', 'RINPO Story', 'story', 'published'),
  ('signup', 'Sign Up', 'auth', 'published')
ON CONFLICT (slug) DO NOTHING;

-- Seed SEO paths
INSERT INTO public.site_seo (path, title, description, og_title, og_description, robots_index, robots_follow) VALUES
  ('/', 'RINADS | Business Simplified', 'RINADS Technologies — AI-powered automation, custom software, and digital marketing. Business Cloud built to run businesses.', 'RINADS | Business Simplified', 'AI-powered automation, custom software, and digital marketing. Business simplified.', true, true),
  ('/grow', 'RINADS Grow — Marketing That Scales With Intelligence', 'RINADS Grow is RINADS'' digital marketing platform — SEO, paid media, and social growth you browse on the web, buy through RINADS, and manage inside Business OS.', 'RINADS Grow — Marketing That Scales With Intelligence', 'Browse SEO, paid media, and social growth packages. Launch campaigns through RINADS and manage them in Business OS.', true, true),
  ('/projects', 'Start a Project | RINADS', 'Tell us about your vision. RINADS crafts bold ideas and ships them as products — websites, apps, commerce, and growth.', 'Start a Project | RINADS', 'Tell us about your vision. RINADS crafts bold ideas and ships them as products.', true, true),
  ('/rinpo-story', 'RINPO Story | RINADS', 'The origin story of RINPO — RINADS intelligence avatar and Business Cloud companion.', 'RINPO Story | RINADS', 'Discover how RINPO powers RINADS Business Cloud.', true, true),
  ('/signup', 'Sign Up | RINADS', 'Create your RINADS account and access Business OS, client portal, and growth tools.', 'Sign Up | RINADS', 'Create your RINADS account.', true, true),
  ('/os', 'RINADS Business Operating System', 'RINADS Business OS — workspace launcher with RINPO intelligence dock.', 'RINADS Business OS', 'Authenticated workspace launcher.', false, false)
ON CONFLICT (path) DO NOTHING;

-- Seed home services section
INSERT INTO public.site_page_sections (page_id, section_key, content, sort_order)
SELECT p.id, 'services.cards', '[
  {"title":"Digital Marketing","description":"SEO, Social Media, and Performance Ads that turn attention into growth.","details":["SEO","Social Media","Performance Ads"],"href":"/grow"},
  {"title":"Custom Software Development","description":"Web Apps, Mobile Apps, and ERP systems built to run your business.","details":["Web Apps","Mobile Apps","ERP Systems"]},
  {"title":"AI Automation","description":"Chatbots, workflow automation, and AI tools that simplify operations.","details":["Chatbots","Workflow Automation","AI Tools"]}
]'::jsonb, 1
FROM public.site_pages p
WHERE p.slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;

INSERT INTO public.site_page_sections (page_id, section_key, content, sort_order)
SELECT p.id, 'about', '{"eyebrow":"About RINADS","headline":"Business simplified.","body":"RINADS® is a software and growth company building Business Cloud, websites, marketing systems, and AI-powered automation — from India to the world.","subbody":"Software · Websites · Marketing · AI automation. Built to run businesses."}'::jsonb, 2
FROM public.site_pages p
WHERE p.slug = 'home'
ON CONFLICT (page_id, section_key) DO NOTHING;
