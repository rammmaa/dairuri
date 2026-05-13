import { Injectable } from "@nestjs/common";
import type { BusReport } from "@dairuri/shared";

@Injectable()
export class BusReportsRepository {
  private readonly reports: BusReport[] = [];

  save(report: BusReport): BusReport {
    const savedReport = cloneReport(report);
    this.reports.unshift(savedReport);
    return cloneReport(savedReport);
  }

  findRecent(routeNumber?: string, limit = 20): BusReport[] {
    const reports = routeNumber
      ? this.reports.filter((report) => report.routeNumber === routeNumber)
      : this.reports;

    return reports.slice(0, limit).map(cloneReport);
  }
}

function cloneReport(report: BusReport): BusReport {
  return {
    ...report,
    location: { ...report.location },
  };
}
