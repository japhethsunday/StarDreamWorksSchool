-- ============================================================================
-- STAR DreamWorks Schools — Supabase Row Level Security baseline
-- ============================================================================
-- Run this ONCE in the Supabase Dashboard: SQL Editor -> New query -> paste
-- -> Run. It is safe to re-run (all statements are idempotent).
--
-- ARCHITECTURE NOTE (read before changing anything):
-- The application connects through Prisma using the database owner
-- credentials, and every API route enforces roles server-side
-- (getServerSession + ADMIN / TEACHER / STUDENT / PARENT checks). That
-- secure API layer remains the enforcement point for the role rules:
--   - students see only their own records
--   - teachers see only assigned classes / subjects / students
--   - parents see only linked children
--   - admins manage everything
-- What this script adds is DEFENSE IN DEPTH at the database level:
--   1. RLS is ENABLED on all 22 application tables.
--   2. NO policies are granted to the `anon` or `authenticated` roles, so
--      any direct access via the public API keys returns zero rows
--      (default-deny). The negative test in step 4 below proves this.
--   3. The owner / service_role used by the application bypasses RLS, so
--      the app keeps working unchanged.
-- The Supabase Table Editor also bypasses RLS, so you can still inspect
-- data in the dashboard.
-- ============================================================================

-- 1. Enable RLS on every application table -------------------------------
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_class       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subject     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subject       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.educational_levels  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admission_enquiries ENABLE ROW LEVEL SECURITY;

-- 2. Explicitly revoke direct access from the public-facing roles ---------
-- (Belt and suspenders: with zero policies these roles already see
-- nothing, but revoking table privileges makes the deny independent of
-- RLS and blocks even policy-misconfiguration accidents.)
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'users','students','teachers','parents','parent_student','classes',
    'subjects','teacher_class','teacher_subject','class_subject',
    'assignments','submissions','grades','learning_materials',
    'announcements','news','events','gallery_items','activity_logs',
    'educational_levels','site_settings','admission_enquiries'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
  END LOOP;
END
$$;

-- 3. Verify: every table must show rowsecurity = true --------------------
-- Expected: 22 rows, all true.
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users','students','teachers','parents','parent_student','classes',
    'subjects','teacher_class','teacher_subject','class_subject',
    'assignments','submissions','grades','learning_materials',
    'announcements','news','events','gallery_items','activity_logs',
    'educational_levels','site_settings','admission_enquiries'
  )
ORDER BY tablename;

-- 4. NEGATIVE TEST (unauthorized access must return nothing) --------------
-- In the SQL Editor, open a NEW query and run it as the anon key user is
-- not possible from the editor (editor runs as postgres, which bypasses
-- RLS). Instead, test from any machine with curl, using your ANON key:
--
--   curl -H "apikey: <YOUR-ANON-KEY>" \
--        -H "Authorization: Bearer <YOUR-ANON-KEY>" \
--        "https://<YOUR-REF>.supabase.co/rest/v1/students?select=id&limit=1"
--
-- Expected result: []  (empty array — blocked)
-- A second check against users must also return [].
--
--   curl -H "apikey: <YOUR-ANON-KEY>" \
--        -H "Authorization: Bearer <YOUR-ANON-KEY>" \
--        "https://<YOUR-REF>.supabase.co/rest/v1/users?select=id&limit=1"
--
-- If either returns rows, STOP and report back before going live.
-- ============================================================================
