-- ============================================================================
-- STAR DreamWorks Schools — Supabase Storage buckets + policies
-- ============================================================================
-- Safe to re-run (all statements are idempotent). Run in the Supabase
-- Dashboard -> SQL Editor -> New query -> Run, OR applied by the app owner.
--
-- The application keeps using Cloudinary for signed file uploads (see
-- src/app/dashboard/admin/gallery/page.tsx and the /api/admin/gallery/sign
-- endpoint). These buckets are provisioned so Supabase Storage is ready and
-- RLS-protected if the admin media pipeline is ever moved onto Supabase.
--
-- Public buckets are readable by the `anon` role so published content can be
-- served to visitors; write access is NOT granted to anon/authenticated — all
-- writes are performed by the database owner / service_role that bypasses RLS.
-- ============================================================================

-- Buckets (id, name)
INSERT INTO storage.buckets (id, name, public, owner)
VALUES
  ('gallery',     'gallery',     true,  (select auth.uid())),
  ('news',        'news',        true,  (select auth.uid())),
  ('events',      'events',      true,  (select auth.uid())),
  ('materials',   'materials',   false, (select auth.uid())),
  ('assignments', 'assignments', false, (select auth.uid())),
  ('documents',   'documents',   false, (select auth.uid()))
ON CONFLICT (id) DO NOTHING;

-- Per-bucket storage object policies
DO $$
DECLARE
  b text;
  buckets_public  text[] := ARRAY['gallery','news','events'];
  buckets_private text[] := ARRAY['materials','assignments','documents'];
BEGIN
  FOREACH b IN ARRAY buckets_public LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public_read_%I" ON storage.objects', b);
    EXECUTE format('DROP POLICY IF EXISTS "owner_all_%I" ON storage.objects', b);
    EXECUTE format('CREATE POLICY "public_read_%I" ON storage.objects FOR SELECT USING (bucket_id = %L)', b, b);
    EXECUTE format('CREATE POLICY "owner_all_%I" ON storage.objects FOR ALL TO authenticated USING (bucket_id = %L) WITH CHECK (bucket_id = %L)', b, b, b);
  END LOOP;
  FOREACH b IN ARRAY buckets_private LOOP
    EXECUTE format('DROP POLICY IF EXISTS "owner_all_%I" ON storage.objects', b);
    EXECUTE format('CREATE POLICY "owner_all_%I" ON storage.objects FOR ALL TO authenticated USING (bucket_id = %L) WITH CHECK (bucket_id = %L)', b, b, b);
  END LOOP;
END
$$;