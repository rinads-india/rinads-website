-- Refresh persisted marketing CMS content to the current RINADS launch positioning.
-- This is intentionally a forward/idempotent migration. Do not rewrite the original CMS seed.

DO $$
DECLARE
  home_page_id uuid;
BEGIN
  SELECT id INTO home_page_id
  FROM public.site_pages
  WHERE slug = 'home';

  IF home_page_id IS NULL THEN
    RAISE EXCEPTION 'CMS home page not found';
  END IF;

  UPDATE public.site_pages
  SET
    title = 'RINADS Home',
    layout_key = 'marketing',
    status = 'published',
    updated_at = now()
  WHERE id = home_page_id;

  INSERT INTO public.site_page_sections (page_id, section_key, content, sort_order, updated_at)
  VALUES (
    home_page_id,
    'services.cards',
    '[
      {"title":"Software","description":"Build web apps, mobile apps, and business systems through Build OS.","details":["Web Apps","Mobile Apps","Business Systems"],"href":"/services/software"},
      {"title":"Marketing","description":"Grow brands with SEO, paid media, social, and CRM programs.","details":["SEO","Performance Ads","Social"],"href":"/services/marketing"},
      {"title":"AI & Automation","description":"Assistants, agents, and workflows powered by RINPO.","details":["AI Assistants","Workflows","Voice Agents"],"href":"/services/ai"}
    ]'::jsonb,
    1,
    now()
  )
  ON CONFLICT (page_id, section_key)
  DO UPDATE SET
    content = excluded.content,
    sort_order = excluded.sort_order,
    updated_at = now();

  INSERT INTO public.site_page_sections (page_id, section_key, content, sort_order, updated_at)
  VALUES (
    home_page_id,
    'about',
    '{"eyebrow":"About RINADS","headline":"The AI Operating Platform for Business.","body":"RINADS® is an intelligent operating platform — run, build, grow, learn, and automate through one ecosystem powered by RINPO.","subbody":"RINPO is the interface. RINADS Intelligence is the brain. RINPO Runtime executes governed business actions."}'::jsonb,
    2,
    now()
  )
  ON CONFLICT (page_id, section_key)
  DO UPDATE SET
    content = excluded.content,
    sort_order = excluded.sort_order,
    updated_at = now();
END $$;

INSERT INTO public.site_seo (
  path,
  title,
  description,
  og_title,
  og_description,
  robots_index,
  robots_follow,
  updated_at
)
VALUES (
  '/',
  'RINADS | The AI Operating Platform for Business',
  'Run your business. Build your software. Grow your brand. Automate your operations. Train your people. One intelligent platform powered by RINPO.',
  'RINADS | The AI Operating Platform for Business',
  'Run, build, grow, learn and automate through one intelligent business platform powered by RINPO.',
  true,
  true,
  now()
)
ON CONFLICT (path)
DO UPDATE SET
  title = excluded.title,
  description = excluded.description,
  og_title = excluded.og_title,
  og_description = excluded.og_description,
  robots_index = excluded.robots_index,
  robots_follow = excluded.robots_follow,
  updated_at = now();
