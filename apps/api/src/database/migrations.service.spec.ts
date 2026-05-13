import { describe, expect, it, vi } from "vitest";
import { MigrationsService } from "./migrations.service";

describe("MigrationsService", () => {
  it("executes the bundled schema once", async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const service = new MigrationsService({ query } as never);

    await service.apply();

    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toContain("CREATE TABLE IF NOT EXISTS users");
    expect(query.mock.calls[0][0]).toContain("CREATE TABLE IF NOT EXISTS bus_reports");
  });
});
