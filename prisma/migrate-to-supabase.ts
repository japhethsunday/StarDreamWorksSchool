/**
 * One-way data migration: Neon PostgreSQL -> Supabase PostgreSQL.
 *
 * Copies every record for all 22 application models, parents before
 * children so foreign keys stay intact. Safe to re-run: existing rows are
 * skipped, only missing rows are inserted.
 *
 * NO SECRETS IN THIS FILE. Both connection strings come from the process
 * environment (set them in your own PowerShell session before running):
 *
 *   $env:SOURCE_DATABASE_URL = 'postgresql://...neon.tech.../neondb?sslmode=require'
 *   $env:TARGET_DATABASE_URL = 'postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres'
 *   npx tsx prisma/migrate-to-supabase.ts
 *
 * Use the DIRECT (port 5432) strings on both ends, not the pooler.
 */
import { PrismaClient } from "@prisma/client";

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;

if (!sourceUrl || !targetUrl) {
  console.error(
    "Missing env vars. Set $env:SOURCE_DATABASE_URL and $env:TARGET_DATABASE_URL first."
  );
  process.exit(1);
}

const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });

// Parents before children to satisfy foreign-key constraints.
const MODELS_IN_ORDER = [
  "user",
  "educationalLevel",
  "siteSetting",
  "subject",
  "teacher",
  "parent",
  "class",
  "teacherClass",
  "teacherSubject",
  "classSubject",
  "student",
  "parentStudent",
  "assignment",
  "submission",
  "grade",
  "learningMaterial",
  "announcement",
  "news",
  "event",
  "galleryItem",
  "activityLog",
  "admissionEnquiry",
] as const;

async function main() {
  console.log("Migrating data Neon -> Supabase...\n");

  let failed = 0;

  for (const model of MODELS_IN_ORDER) {
    const src = (source as any)[model];
    const dst = (target as any)[model];
    try {
      const rows = await src.findMany();
      if (rows.length === 0) {
        console.log(`  ${model}: 0 rows (nothing to copy)`);
        continue;
      }
      const result = await dst.createMany({
        data: rows,
        skipDuplicates: true,
      });
      const targetCount = await dst.count();
      const ok = targetCount >= rows.length;
      console.log(
        `  ${model}: source=${rows.length} inserted=${result.count} target_total=${targetCount} ${ok ? "OK" : "MISMATCH"}`
      );
      if (!ok) failed++;
    } catch (err: any) {
      failed++;
      console.error(`  ${model}: FAILED - ${err.message}`);
    }
  }

  console.log(
    failed === 0
      ? "\nMigration complete: all tables verified."
      : `\nMigration finished WITH ${failed} problem(s). See lines above.`
  );
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("Fatal migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await source.$disconnect();
    await target.$disconnect();
  });
