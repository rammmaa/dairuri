export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export function hasLiveApiBaseUrl() {
  return Boolean(getLiveApiBaseUrl());
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const baseUrl = getLiveApiBaseUrl();

  if (!baseUrl) {
    throw new Error("EXPO_PUBLIC_DARORI_API_BASE_URL is required for live API calls");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function getLiveApiBaseUrl() {
  const baseUrl = process.env.EXPO_PUBLIC_DARORI_API_BASE_URL?.trim();

  if (!baseUrl) {
    return undefined;
  }

  return baseUrl.replace(/\/$/, "");
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message ?? payload.error;
  } catch {
    return response.statusText;
  }
}
