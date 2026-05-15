import { createMigrationPlan } from "../server/db/migrate";

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
});
