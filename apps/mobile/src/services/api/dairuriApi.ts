import type {
  BusReport,
  BusReportInput,
  ChatRoomSummary,
  CreateJobPostInput,
  CreateRidePostInput,
  JobListing,
  RideListing,
  UserProfileSummary,
} from "@dairuri/shared";

const defaultApiBaseUrl = "http://localhost:3000";

export function getApiBaseUrl(): string {
  const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "test") {
    return defaultApiBaseUrl;
  }

  return "";
}

export function fetchRides(): Promise<RideListing[]> {
  return requestJson("/rides");
}

export function fetchJobs(): Promise<JobListing[]> {
  return requestJson("/jobs");
}

export function createRidePost(
  input: CreateRidePostInput & { lat: number; lng: number },
): Promise<RideListing> {
  return requestJson("/rides", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function createJobPost(input: CreateJobPostInput): Promise<JobListing> {
  return requestJson("/jobs", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function fetchRecentBusReports(routeNumber?: string): Promise<BusReport[]> {
  const query = routeNumber ? `?routeNumber=${encodeURIComponent(routeNumber)}` : "";
  return requestJson(`/bus-reports/recent${query}`);
}

export function createBusReport(input: BusReportInput): Promise<BusReport> {
  return requestJson("/bus-reports", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

export function fetchMyProfile(): Promise<UserProfileSummary> {
  return requestJson("/users/me");
}

export function fetchChatRooms(): Promise<ChatRoomSummary[]> {
  return requestJson("/chat/rooms");
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const response = init ? await fetch(url, init) : await fetch(url);

  if (!response.ok) {
    throw new Error(`Dairuri API request failed: ${response.status} ${url}`);
  }

  return (await response.json()) as T;
}
