export type InitialAuthStateInput = {
  hasAuthSession: boolean;
  skipAuth?: string;
};

export function resolveInitialAuthenticated({
  hasAuthSession,
  skipAuth,
}: InitialAuthStateInput) {
  return hasAuthSession || skipAuth === "true";
}
