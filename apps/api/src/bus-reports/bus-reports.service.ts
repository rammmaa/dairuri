import { Injectable } from "@nestjs/common";
import type { BusReport, BusReportInput } from "@dairuri/shared";
import { BusReportsRepository } from "./bus-reports.repository";

@Injectable()
export class BusReportsService {
  private nextId = 1;

  constructor(
    private readonly busReportsRepository: BusReportsRepository = new BusReportsRepository(),
  ) {}

  create(input: BusReportInput): BusReport {
    const report: BusReport = {
      ...input,
      id: `bus-report-${this.nextId}`,
      location: {
        lat: input.lat,
        lng: input.lng,
      },
      observedAt: new Date().toISOString(),
    };

    this.nextId += 1;

    return this.busReportsRepository.save(report);
  }

  findRecent(routeNumber?: string): BusReport[] {
    return this.busReportsRepository.findRecent(routeNumber);
  }
}
