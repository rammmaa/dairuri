import type { UserProfile } from "../types/domain";

let authToken: string | undefined;
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
