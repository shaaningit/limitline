import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { QUEST_IDS, REJECT_REASONS } from "./config";

// The database lists quest ids and reject reasons too; fail if they drift from config.ts.
const migrationsDir = join(__dirname, "../../supabase/migrations");
const sql = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => readFileSync(join(migrationsDir, f), "utf8"))
  .join("\n");

const quoted = (text: string) => [...text.matchAll(/'([a-z0-9_]+)'/g)].map((m) => m[1]);

describe("database lists match lib/rules/config.ts", () => {
  it("quest ids", () => {
    const enumBody = sql.match(/create type public\.quest_id as enum \(([^)]*)\)/)![1];
    expect(quoted(enumBody)).toEqual(QUEST_IDS);
  });

  it("reject reasons", () => {
    // Later migrations redefine the list, so the last definition is the one in force.
    const checkBody = [...sql.matchAll(/reject_reason in\s*\(([^)]*)\)/g)].at(-1)![1];
    expect(quoted(checkBody).sort()).toEqual(Object.keys(REJECT_REASONS).sort());
  });
});
