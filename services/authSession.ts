import type { UserProfile } from "../types/domain";

const initialTestAuthToken =
  process.env.EXPO_PUBLIC_DARORI_SKIP_AUTH === "true"
    ? process.env.EXPO_PUBLIC_DARORI_TEST_AUTH_TOKEN?.trim()
    : undefined;

let authToken: string | undefined = initialTestAuthToken || undefined;
let sessionUser: UserProfile | undefined;

export function getAuthToken() {
  return authToken;
}

export function getSessionUser() {
  return sessionUser;
}

export function hasAuthSession() {
  return Boolean(authToken);
}

export function setAuthSession(token: string, user: UserProfile) {
  authToken = token;
  sessionUser = user;
}

export function clearAuthSession() {
  authToken = undefined;
  sessionUser = undefined;
}
