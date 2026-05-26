import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createMigrationPlan, readSchemaMigrations } from "../server/db/migrate";

describe("server database migration plan", () => {
  it("returns only migrations that have not been applied", () => {
    expect(
      createMigrationPlan(["001_initial_schema"], [
        { id: "001_initial_schema", sql: "select 1" },
        { id: "002_add_reports", sql: "select 2" },
      ]),
    ).toEqual([{ id: "002_add_reports", sql: "select 2" }]);
  });

  it("rejects duplicate migration ids", () => {
    expect(() =>
      createMigrationPlan([], [
        { id: "001_initial_schema", sql: "select 1" },
        { id: "001_initial_schema", sql: "select 2" },
      ]),
    ).toThrow("duplicate migration id: 001_initial_schema");
  });

  it("loads the shipped feature migrations after the initial schema", async () => {
    await expect(readSchemaMigrations()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "001_initial_schema" }),
        expect.objectContaining({ id: "002_bus_archive" }),
        expect.objectContaining({ id: "002_human_resource_profiles" }),
      ]),
    );
  });
});

describe("readSchemaMigrations", () => {
  let workspace: string;
  let schemaPath: string;
  let migrationsDir: string;

  beforeEach(async () => {
    workspace = await mkdtemp(path.join(tmpdir(), "darori-migrations-"));
    schemaPath = path.join(workspace, "schema.sql");
    migrationsDir = path.join(workspace, "migrations");
    await writeFile(schemaPath, "-- initial schema sql\n", "utf8");
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it("returns only the initial schema when the migrations directory is missing", async () => {
    const migrations = await readSchemaMigrations(schemaPath, migrationsDir);
    expect(migrations).toEqual([
      { id: "001_initial_schema", sql: "-- initial schema sql\n" },
    ]);
  });

  it("loads additional sql files from the migrations directory in filename order", async () => {
    await mkdir(migrationsDir, { recursive: true });
    await writeFile(
      path.join(migrationsDir, "002_bus_archive.sql"),
      "-- bus archive\n",
      "utf8",
    );
    await writeFile(
      path.join(migrationsDir, "003_followups.sql"),
      "-- followups\n",
      "utf8",
    );

    const migrations = await readSchemaMigrations(schemaPath, migrationsDir);

    expect(migrations.map((migration) => migration.id)).toEqual([
      "001_initial_schema",
      "002_bus_archive",
      "003_followups",
    ]);
    expect(migrations[1]?.sql).toBe("-- bus archive\n");
  });

  it("ignores non-sql files in the migrations directory", async () => {
    await mkdir(migrationsDir, { recursive: true });
    await writeFile(path.join(migrationsDir, "readme.md"), "ignore me", "utf8");
    await writeFile(
      path.join(migrationsDir, "002_bus_archive.sql"),
      "-- bus archive\n",
      "utf8",
    );

    const migrations = await readSchemaMigrations(schemaPath, migrationsDir);

    expect(migrations.map((migration) => migration.id)).toEqual([
      "001_initial_schema",
      "002_bus_archive",
    ]);
  });

  it("includes the real feature migrations shipped with the repository", async () => {
    const migrations = await readSchemaMigrations();
    const ids = migrations.map((migration) => migration.id);

    expect(ids[0]).toBe("001_initial_schema");
    expect(ids).toContain("002_bus_archive");
    expect(ids).toContain("002_human_resource_profiles");
    expect(ids.indexOf("002_bus_archive")).toBeGreaterThan(
      ids.indexOf("001_initial_schema"),
    );
    expect(ids.indexOf("002_human_resource_profiles")).toBeGreaterThan(
      ids.indexOf("001_initial_schema"),
    );
  });
});
