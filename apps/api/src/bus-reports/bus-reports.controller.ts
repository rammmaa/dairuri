import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CreateBusReportDto } from "./bus-report.dto";
import { BusReportsService } from "./bus-reports.service";

@Controller("bus-reports")
export class BusReportsController {
  constructor(private readonly busReportsService: BusReportsService) {}

  @Get("recent")
  findRecent(@Query("routeNumber") routeNumber?: string) {
    return this.busReportsService.findRecent(routeNumber);
  }

  @Post()
  create(@Body() dto: CreateBusReportDto) {
    return this.busReportsService.create(dto);
  }
}
