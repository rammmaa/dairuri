import { Module } from "@nestjs/common";
import { MigrationsService } from "./migrations.service";
import { PostgresService } from "./postgres.service";
import { RedisService } from "./redis.service";

@Module({
  providers: [PostgresService, RedisService, MigrationsService],
  exports: [PostgresService, RedisService, MigrationsService],
})
export class DatabaseModule {}
