import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const directory = join(process.cwd(), "supabase", "migrations");
const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
const versions = files.map((file) => {
  const match = file.match(/^(\d{14})_([a-z0-9_]+)\.sql$/);
  if (!match) throw new Error("Invalid migration filename: " + file);
  return { version: match[1], file };
});

const duplicates = versions.filter((item, index) =>
  versions.findIndex((other) => other.version === item.version) !== index,
);
if (duplicates.length) throw new Error("Duplicate migration versions: " + duplicates.map((x) => x.version).join(", "));

const baseline = versions.find((item) => item.version === "20261120172607");
if (!baseline) throw new Error("The reproducible SCHOOLVERSE baseline migration is missing.");
if (versions[0]?.version !== baseline.version) throw new Error("The SCHOOLVERSE baseline must be the first migration.");

for (const item of versions) {
  if (item.version === baseline.version) continue;
  const content = await readFile(join(directory, item.file), "utf8");
  const marker = content.match(/^-- Historical migration placeholder: ([a-z0-9_]+) \((\d{14})\)\.$/m);
  if (!marker) {
    throw new Error("Historical migration placeholder marker is missing or malformed: " + item.file);
  }
  if (marker[1] !== item.file.slice(15, -4) || marker[2] !== item.version) {
    throw new Error("Historical migration marker does not match filename: " + item.file);
  }
  if (!content.includes(baseline.file)) {
    throw new Error("Historical migration placeholder must point to the canonical baseline: " + item.file);
  }
}

const sql = await readFile(join(directory, baseline.file), "utf8");
const requiredTables = [
  "schools", "school_memberships", "academic_years", "classes", "sections",
  "students", "staff", "student_guardians", "attendance", "fee_invoices",
  "fee_payments", "audit_logs", "school_applications", "timetable_entries",
  "homework", "school_notices", "exams", "exam_results", "teaching_assignments",
];
for (const table of requiredTables) {
  if (!new RegExp("create\\s+table\\s+public\\." + table + "\\b", "i").test(sql)) {
    throw new Error("Baseline is missing table: " + table);
  }
}
const tableCount = (sql.match(/create\s+table\s+public\./gi) ?? []).length;
const rlsCount = (sql.match(/alter\s+table\s+public\..*enable\s+row\s+level\s+security/gi) ?? []).length;
const policyCount = (sql.match(/create\s+policy\s/gi) ?? []).length;
const functionCount = (sql.match(/create\s+or\s+replace\s+function\s+public\./gi) ?? []).length;
if (tableCount !== requiredTables.length) throw new Error("Expected " + requiredTables.length + " baseline tables, found " + tableCount);
if (rlsCount !== requiredTables.length) throw new Error("Expected RLS on all " + requiredTables.length + " tables, found " + rlsCount);
if (policyCount < 20) throw new Error("Baseline has an unexpectedly low policy count: " + policyCount);
if (functionCount < 5) throw new Error("Baseline is missing critical database functions: " + functionCount);
if (!/revoke\s+all\s+on\s+all\s+tables\s+in\s+schema\s+public\s+from\s+anon/i.test(sql)) {
  throw new Error("Baseline must revoke anonymous access to public tables.");
}

console.log("Validated " + versions.length + " migration files; baseline includes " + tableCount + " tables, " + rlsCount + " RLS-enabled tables, " + policyCount + " policies and " + functionCount + " functions.");
