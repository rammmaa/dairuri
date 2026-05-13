import { Module } from "@nestjs/common";
import { BusReportsController } from "./bus-reports.controller";
import { BusReportsRepository } from "./bus-reports.repository";
import { BusReportsService } from "./bus-reports.service";

@Module({
  controllers: [BusReportsController],
  providers: [BusReportsRepository, BusReportsService],
  exports: [BusReportsService],
})
export class BusReportsModule {}
