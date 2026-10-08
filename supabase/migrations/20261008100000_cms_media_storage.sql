-- CMS Phase C slice C2: public Storage bucket for marketing media uploads.
-- Unapplied / founder-gated. platform-admin uploads via service role when live;
-- demo mode uses an in-memory data-URL fallback without this bucket.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rinads-cms',
  'rinads-cms',
  true,
  5242880,
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read of CMS media objects
DROP POLICY IF EXISTS rinads_cms_media_public_select ON storage.objects;
CREATE POLICY rinads_cms_media_public_select ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'rinads-cms');

-- Privileged platform editors may write CMS media
DROP POLICY IF EXISTS rinads_cms_media_privileged_insert ON storage.objects;
CREATE POLICY rinads_cms_media_privileged_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'rinads-cms'
    AND private.is_platform_privileged_user()
  );

DROP POLICY IF EXISTS rinads_cms_media_privileged_update ON storage.objects;
CREATE POLICY rinads_cms_media_privileged_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'rinads-cms'
    AND private.is_platform_privileged_user()
  )
  WITH CHECK (
    bucket_id = 'rinads-cms'
    AND private.is_platform_privileged_user()
  );

DROP POLICY IF EXISTS rinads_cms_media_privileged_delete ON storage.objects;
CREATE POLICY rinads_cms_media_privileged_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'rinads-cms'
    AND private.is_platform_privileged_user()
  );
