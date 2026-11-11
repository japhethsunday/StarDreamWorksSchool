-- Adds the CA / exam split and result publishing to grades.
-- Run once in the Supabase SQL editor. Safe to run again.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'grades' AND column_name = 'publishedAt'
  ) THEN
    ALTER TABLE grades ADD COLUMN "publishedAt" TIMESTAMP(3);
    -- Grades that existed before this change were already visible to parents.
    UPDATE grades SET "publishedAt" = "createdAt";
  END IF;
END $$;

ALTER TABLE grades ADD COLUMN IF NOT EXISTS "caScore" DOUBLE PRECISION;
ALTER TABLE grades ADD COLUMN IF NOT EXISTS "examScore" DOUBLE PRECISION;
CREATE INDEX IF NOT EXISTS "grades_classId_academicSession_term_idx" ON grades ("classId", "academicSession", term);
