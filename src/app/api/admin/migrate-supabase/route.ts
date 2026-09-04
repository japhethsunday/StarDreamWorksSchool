import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { prisma as sourcePrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * TEMPORARY one-shot migration endpoint: copies the production database
 * (Neon, via the app's own connection) into Supabase. Runs on Vercel
 * infrastructure, which can reach both database hosts.
 *
 * POST body: { token, supabaseUrl, step, table? }
 *   step "schema"          -> create all tables/indexes/keys on Supabase
 *   step "copy"&table="x"  -> copy one model (see MODEL_TABLES keys)
 *   step "rls"             -> enable RLS + revoke anon/authenticated
 *   step "verify"          -> counts per table + RLS status report
 *
 * DELETE THIS FILE after the migration is verified live.
 */
const ONE_TIME_TOKEN = "sdsw-mig-2026-K7p2X9mQ4vT8zR5";

const MODEL_TABLES: Array<{ model: string; table: string }> = [
  { model: "user", table: "users" },
  { model: "educationalLevel", table: "educational_levels" },
  { model: "siteSetting", table: "site_settings" },
  { model: "subject", table: "subjects" },
  { model: "teacher", table: "teachers" },
  { model: "parent", table: "parents" },
  { model: "class", table: "classes" },
  { model: "teacherClass", table: "teacher_class" },
  { model: "teacherSubject", table: "teacher_subject" },
  { model: "classSubject", table: "class_subject" },
  { model: "student", table: "students" },
  { model: "parentStudent", table: "parent_student" },
  { model: "assignment", table: "assignments" },
  { model: "submission", table: "submissions" },
  { model: "grade", table: "grades" },
  { model: "learningMaterial", table: "learning_materials" },
  { model: "announcement", table: "announcements" },
  { model: "news", table: "news" },
  { model: "event", table: "events" },
  { model: "galleryItem", table: "gallery_items" },
  { model: "activityLog", table: "activity_logs" },
  { model: "admissionEnquiry", table: "admission_enquiries" },
];

const RLS_TABLES = MODEL_TABLES.map((m) => m.table);

const SCHEMA_SQL = `-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "image" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "classId" TEXT,
    "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentContact" TEXT,
    "address" TEXT,
    "profilePhoto" TEXT,
    "academicSession" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "teachers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "qualification" TEXT,
    "specialization" TEXT,
    "hireDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "occupation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parents_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "parent_student" (
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "parent_student_pkey" PRIMARY KEY ("parentId","studentId")
);
-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT,
    "level" TEXT NOT NULL,
    "classTeacherId" TEXT,
    "academicSession" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 40,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "teacher_class" (
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,

    CONSTRAINT "teacher_class_pkey" PRIMARY KEY ("teacherId","classId")
);
-- CreateTable
CREATE TABLE "teacher_subject" (
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "teacher_subject_pkey" PRIMARY KEY ("teacherId","subjectId")
);
-- CreateTable
CREATE TABLE "class_subject" (
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "class_subject_pkey" PRIMARY KEY ("classId","subjectId")
);
-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "content" TEXT,
    "files" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grade" INTEGER,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),
    "gradedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicSession" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "grade" TEXT NOT NULL,
    "remarks" TEXT,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "learning_materials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT,
    "subjectId" TEXT,
    "classId" TEXT,
    "teacherId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_materials_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL DEFAULT 'SCHOOL',
    "classId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "image" TEXT,
    "authorId" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "image" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "gallery_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "educational_levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "ageRange" TEXT,
    "tagline" TEXT,
    "description" TEXT,
    "highlights" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "educational_levels_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "admission_enquiries" (
    "id" TEXT NOT NULL,
    "childFirstName" TEXT NOT NULL,
    "childLastName" TEXT,
    "dateOfBirth" TEXT,
    "level" TEXT NOT NULL,
    "studentClass" TEXT,
    "parentName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_enquiries_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
-- CreateIndex
CREATE UNIQUE INDEX "students_userId_key" ON "students"("userId");
-- CreateIndex
CREATE UNIQUE INDEX "students_studentId_key" ON "students"("studentId");
-- CreateIndex
CREATE INDEX "students_classId_idx" ON "students"("classId");
-- CreateIndex
CREATE INDEX "students_userId_idx" ON "students"("userId");
-- CreateIndex
CREATE INDEX "students_studentId_idx" ON "students"("studentId");
-- CreateIndex
CREATE UNIQUE INDEX "teachers_userId_key" ON "teachers"("userId");
-- CreateIndex
CREATE UNIQUE INDEX "teachers_teacherId_key" ON "teachers"("teacherId");
-- CreateIndex
CREATE INDEX "teachers_userId_idx" ON "teachers"("userId");
-- CreateIndex
CREATE INDEX "teachers_teacherId_idx" ON "teachers"("teacherId");
-- CreateIndex
CREATE UNIQUE INDEX "parents_userId_key" ON "parents"("userId");
-- CreateIndex
CREATE INDEX "parents_userId_idx" ON "parents"("userId");
-- CreateIndex
CREATE INDEX "classes_classTeacherId_idx" ON "classes"("classTeacherId");
-- CreateIndex
CREATE INDEX "classes_level_idx" ON "classes"("level");
-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");
-- CreateIndex
CREATE INDEX "assignments_subjectId_idx" ON "assignments"("subjectId");
-- CreateIndex
CREATE INDEX "assignments_classId_idx" ON "assignments"("classId");
-- CreateIndex
CREATE INDEX "assignments_teacherId_idx" ON "assignments"("teacherId");
-- CreateIndex
CREATE INDEX "submissions_assignmentId_idx" ON "submissions"("assignmentId");
-- CreateIndex
CREATE INDEX "submissions_studentId_idx" ON "submissions"("studentId");
-- CreateIndex
CREATE INDEX "grades_studentId_idx" ON "grades"("studentId");
-- CreateIndex
CREATE INDEX "grades_subjectId_idx" ON "grades"("subjectId");
-- CreateIndex
CREATE INDEX "grades_classId_idx" ON "grades"("classId");
-- CreateIndex
CREATE INDEX "grades_academicSession_term_idx" ON "grades"("academicSession", "term");
-- CreateIndex
CREATE INDEX "learning_materials_subjectId_idx" ON "learning_materials"("subjectId");
-- CreateIndex
CREATE INDEX "learning_materials_classId_idx" ON "learning_materials"("classId");
-- CreateIndex
CREATE INDEX "learning_materials_teacherId_idx" ON "learning_materials"("teacherId");
-- CreateIndex
CREATE INDEX "announcements_authorId_idx" ON "announcements"("authorId");
-- CreateIndex
CREATE INDEX "announcements_classId_idx" ON "announcements"("classId");
-- CreateIndex
CREATE INDEX "announcements_targetType_idx" ON "announcements"("targetType");
-- CreateIndex
CREATE INDEX "news_authorId_idx" ON "news"("authorId");
-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");
-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");
-- CreateIndex
CREATE UNIQUE INDEX "educational_levels_slug_key" ON "educational_levels"("slug");
-- CreateIndex
CREATE INDEX "educational_levels_sortOrder_idx" ON "educational_levels"("sortOrder");
-- CreateIndex
CREATE UNIQUE INDEX "site_settings_key_key" ON "site_settings"("key");
-- CreateIndex
CREATE INDEX "admission_enquiries_status_idx" ON "admission_enquiries"("status");
-- CreateIndex
CREATE INDEX "admission_enquiries_createdAt_idx" ON "admission_enquiries"("createdAt");
-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "parents" ADD CONSTRAINT "parents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "parent_student" ADD CONSTRAINT "parent_student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "parent_student" ADD CONSTRAINT "parent_student_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "teacher_class" ADD CONSTRAINT "teacher_class_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "teacher_class" ADD CONSTRAINT "teacher_class_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "teacher_subject" ADD CONSTRAINT "teacher_subject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "teacher_subject" ADD CONSTRAINT "teacher_subject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "class_subject" ADD CONSTRAINT "class_subject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "class_subject" ADD CONSTRAINT "class_subject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "learning_materials" ADD CONSTRAINT "learning_materials_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
`;

function targetClient(supabaseUrl: string) {
  return new PrismaClient({ datasources: { db: { url: supabaseUrl } } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, supabaseUrl, step, table } = body;

    if (token !== ONE_TIME_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Forbidden." },
        { status: 403 }
      );
    }
    if (!supabaseUrl || typeof supabaseUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "supabaseUrl is required." },
        { status: 400 }
      );
    }

    const target = targetClient(supabaseUrl);
    try {
      if (step === "schema") {
        const statements = SCHEMA_SQL.split(";")
          .map((s) => s.replace(/--[^\n]*\n/g, "").trim())
          .filter((s) => s.length > 0);
        let applied = 0;
        const skipped: string[] = [];
        for (const stmt of statements) {
          try {
            await target.$executeRawUnsafe(stmt);
            applied++;
          } catch (e: any) {
            const msg = String(e?.message || e);
            // Idempotent re-runs: objects may already exist.
            if (/already exists|duplicate/i.test(msg)) {
              skipped.push(stmt.slice(0, 60));
            } else {
              throw new Error(`DDL failed: ${msg.slice(0, 300)} @ ${stmt.slice(0, 80)}`);
            }
          }
        }
        return NextResponse.json({ success: true, step, applied, alreadyExisted: skipped.length });
      }

      if (step === "copy") {
        const entry = MODEL_TABLES.find((m) => m.model === table);
        if (!entry) {
          return NextResponse.json(
            { success: false, error: `Unknown table key: ${table}` },
            { status: 400 }
          );
        }
        const rows = await (sourcePrisma as any)[entry.model].findMany();
        let inserted = 0;
        if (rows.length > 0) {
          const res = await (target as any)[entry.model].createMany({
            data: rows,
            skipDuplicates: true,
          });
          inserted = res.count;
        }
        const targetCount = await (target as any)[entry.model].count();
        return NextResponse.json({
          success: true,
          step,
          table: entry.table,
          source: rows.length,
          inserted,
          targetTotal: targetCount,
          ok: targetCount >= rows.length,
        });
      }

      if (step === "rls") {
        let enabled = 0;
        for (const t of RLS_TABLES) {
          await target.$executeRawUnsafe(`ALTER TABLE public."${t}" ENABLE ROW LEVEL SECURITY`);
          enabled++;
        }
        await target.$executeRawUnsafe(
          `DO $$ DECLARE t text; tables text[] := ARRAY[${RLS_TABLES.map((t) => `'${t}'`).join(",")}]; BEGIN FOREACH t IN ARRAY tables LOOP EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t); END LOOP; END $$`
        );
        return NextResponse.json({ success: true, step, rlsEnabled: enabled });
      }

      if (step === "verify") {
        const report: Array<{ table: string; source: number; target: number; ok: boolean }> = [];
        for (const entry of MODEL_TABLES) {
          const s = await (sourcePrisma as any)[entry.model].count();
          const t = await (target as any)[entry.model].count();
          report.push({ table: entry.table, source: s, target: t, ok: t >= s });
        }
        const rls = (await target.$queryRawUnsafe(
          `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename IN (${RLS_TABLES.map((t) => `'${t}'`).join(",")}) ORDER BY tablename`
        )) as Array<{ tablename: string; rowsecurity: boolean }>;
        return NextResponse.json({
          success: true,
          step,
          allOk: report.every((r) => r.ok),
          counts: report,
          rls,
        });
      }

      return NextResponse.json(
        { success: false, error: "Unknown step. Use schema|copy|rls|verify." },
        { status: 400 }
      );
    } finally {
      await target.$disconnect();
    }
  } catch (error: any) {
    console.error("Migration endpoint error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: String(error?.message || error).slice(0, 500) },
      { status: 500 }
    );
  }
}
