/**
 * Data migration WITHOUT a direct database connection to Supabase.
 *
 * Use this when port 5432 is unreachable (DNS/IPv6/ISP filtering). It reads
 * from Neon with Prisma (normal connection) and writes to Supabase over
 * HTTPS through PostgREST, which works wherever the dashboard works.
 *
 * Parents are copied before children so foreign keys stay intact. Safe to
 * re-run: rows are upserted on primary key, existing rows are updated to
 * match the source (identical on a second run).
 *
 * NO SECRETS IN THIS FILE. Set these in your own PowerShell session:
 *
 *   $env:SOURCE_DATABASE_URL   = 'your Neon connection string (any of them)'
 *   $env:SUPABASE_URL          = 'https://YOUR-REF.supabase.co'
 *   $env:SUPABASE_SERVICE_KEY  = 'the service_role key of THAT SAME project
 *                                 (Supabase Dashboard -> Settings -> API Keys).
 *                                 NEVER the anon key, NEVER commit this value.'
 *   npx tsx supabase/migrate-via-rest.ts
 */
import { PrismaClient } from "@prisma/client";

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!sourceUrl || !supabaseUrl || !serviceKey) {
  console.error(
    "Missing env vars. Set $env:SOURCE_DATABASE_URL, $env:SUPABASE_URL and $env:SUPABASE_SERVICE_KEY first."
  );
  process.exit(1);
}

const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });

// { prismaModel, restTable } — parents before children for foreign keys.
const TABLES_IN_ORDER: Array<{ model: string; table: string }> = [
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

const BATCH = 500;

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: serviceKey as string,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function restCount(table: string): Promise<number> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/${table}?select=id&limit=1`,
    { headers: headers({ Prefer: "count=exact" }) }
  );
  if (!res.ok) throw new Error(`count ${table}: HTTP ${res.status}`);
  const range = res.headers.get("content-range") || "";
  const m = range.match(/\/(\d+)/);
  return m ? Number(m[1]) : -1;
}

async function restUpsert(table: string, rows: any[]): Promise<number> {
  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: headers({ Prefer: "resolution=merge-duplicates" }),
      body: JSON.stringify(chunk),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`upsert ${table} rows ${i}-${i + chunk.length}: HTTP ${res.status} ${text.slice(0, 300)}`);
    }
    written += chunk.length;
  }
  return written;
}

async function main() {
  console.log("Migrating data Neon -> Supabase over HTTPS...\n");
  let failed = 0;

  for (const { model, table } of TABLES_IN_ORDER) {
    try {
      const rows = await (source as any)[model].findMany();
      if (rows.length === 0) {
        console.log(`  ${table}: 0 rows (nothing to copy)`);
        continue;
      }
      const written = await restUpsert(table, rows);
      const targetCount = await restCount(table);
      const ok = targetCount >= rows.length;
      console.log(
        `  ${table}: source=${rows.length} sent=${written} target_total=${targetCount} ${ok ? "OK" : "MISMATCH"}`
      );
      if (!ok) failed++;
    } catch (err: any) {
      failed++;
      console.error(`  ${table}: FAILED - ${err.message}`);
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
  });
