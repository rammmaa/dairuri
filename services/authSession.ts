import * as SecureStore from "expo-secure-store";

import type { AuthSession, DriverType, UserProfile } from "../types/domain";

const AUTH_SESSION_STORAGE_KEY = "darori.auth.session";

const initialTestAuthToken =
  process.env.EXPO_PUBLIC_DARORI_SKIP_AUTH === "true"
    ? process.env.EXPO_PUBLIC_DARORI_TEST_AUTH_TOKEN?.trim()
    : undefined;

let authToken: string | undefined = initialTestAuthToken || undefined;
let sessionUser: UserProfile | undefined;

type StoredAuthSession = {
  token: string;
  user: UserProfile;
};

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

export async function persistAuthSession(
  token: string,
  user: UserProfile,
): Promise<AuthSession> {
  setAuthSession(token, user);
  await writeStoredSession({ token, user });

  return { token, user };
}

export async function restoreAuthSession(): Promise<AuthSession | undefined> {
  if (authToken && sessionUser) {
    return { token: authToken, user: sessionUser };
  }

  const storedSession = await readStoredSession();
  if (!storedSession) {
    return undefined;
  }

  setAuthSession(storedSession.token, storedSession.user);
  return storedSession;
}

export function clearAuthSession() {
  authToken = undefined;
  sessionUser = undefined;
}

export async function clearPersistedAuthSession(): Promise<void> {
  clearAuthSession();
  await deleteStoredSession();
}

async function writeStoredSession(session: StoredAuthSession) {
  const payload = JSON.stringify(session);

  try {
    if (await canUseSecureStore()) {
      await SecureStore.setItemAsync(AUTH_SESSION_STORAGE_KEY, payload);
      return;
    }

    getLocalStorage()?.setItem(AUTH_SESSION_STORAGE_KEY, payload);
  } catch {
    // Keep the in-memory session active even when device persistence is unavailable.
  }
}

async function readStoredSession(): Promise<StoredAuthSession | undefined> {
  try {
    const payload = (await canUseSecureStore())
      ? await SecureStore.getItemAsync(AUTH_SESSION_STORAGE_KEY)
      : getLocalStorage()?.getItem(AUTH_SESSION_STORAGE_KEY) ?? null;

    if (!payload) {
      return undefined;
    }

    const parsed = JSON.parse(payload) as unknown;
    if (isStoredAuthSession(parsed)) {
      return parsed;
    }

    await deleteStoredSession();
    return undefined;
  } catch {
    return undefined;
  }
}

async function deleteStoredSession() {
  try {
    if (await canUseSecureStore()) {
      await SecureStore.deleteItemAsync(AUTH_SESSION_STORAGE_KEY);
      return;
    }

    getLocalStorage()?.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Logout should still clear the in-memory session if persistence cleanup fails.
  }
}

async function canUseSecureStore() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

function getLocalStorage() {
  try {
    return (globalThis as { localStorage?: Storage }).localStorage;
  } catch {
    return undefined;
  }
}

function isStoredAuthSession(value: unknown): value is StoredAuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Partial<StoredAuthSession>;
  return typeof session.token === "string" && isUserProfile(session.user);
}

function isUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Partial<UserProfile>;
  return (
    typeof user.id === "string" &&
    typeof user.nickname === "string" &&
    typeof user.temperature === "number" &&
    isDriverType(user.driverType)
  );
}

function isDriverType(value: unknown): value is DriverType {
  return value === "driver" || value === "nonDriver";
}
