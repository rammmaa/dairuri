import type {
  BusReport,
  BusReportInput,
  JobListing,
  RideListing,
} from "@dairuri/shared";

const defaultApiBaseUrl = "http://localhost:3000";

export function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultApiBaseUrl;
}

export function fetchRides(): Promise<RideListing[]> {
  return requestJson("/rides");
}

export function fetchJobs(): Promise<JobListing[]> {
  return requestJson("/jobs");
}

export function fetchRecentBusReports(): Promise<BusReport[]> {
  return requestJson("/bus-reports/recent");
}

export function createBusReport(input: BusReportInput): Promise<BusReport> {
  return requestJson("/bus-reports", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const response = init ? await fetch(url, init) : await fetch(url);

  if (!response.ok) {
    throw new Error(`Dairuri API request failed: ${response.status} ${url}`);
  }

  return (await response.json()) as T;
}
