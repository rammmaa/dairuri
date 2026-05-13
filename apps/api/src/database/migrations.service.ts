import { Injectable, OnModuleInit } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PostgresService } from "./postgres.service";

@Injectable()
export class MigrationsService implements OnModuleInit {
  constructor(private readonly postgres: PostgresService) {}

  async onModuleInit(): Promise<void> {
    if (process.env.RUN_DB_MIGRATIONS !== "true") {
      return;
    }

    await this.apply();
  }

  async apply(): Promise<void> {
    const schema = await readFile(join(__dirname, "schema.sql"), "utf8");
    await this.postgres.query(schema);
  }
}
