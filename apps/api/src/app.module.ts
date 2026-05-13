import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BusReportsModule } from "./bus-reports/bus-reports.module";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health/health.controller";
import { JobsModule } from "./jobs/jobs.module";
import { RidesModule } from "./rides/rides.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RidesModule,
    BusReportsModule,
    JobsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
