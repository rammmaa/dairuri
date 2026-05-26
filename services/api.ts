import * as liveApi from "./liveApi";
import * as mockApi from "./mockApi";

type ApiMode = "live" | "mock";
type ApiModeEnv = Partial<
  Record<
    "NODE_ENV" | "EXPO_PUBLIC_DARORI_API_BASE_URL" | "EXPO_PUBLIC_DARORI_USE_MOCK_API",
    string
  >
>;

export function resolveApiMode(env: ApiModeEnv = process.env): ApiMode {
  if (env.NODE_ENV === "test" || env.EXPO_PUBLIC_DARORI_USE_MOCK_API === "true") {
    return "mock";
  }

  return "live";
}

const activeApi = () => (resolveApiMode() === "mock" ? mockApi : liveApi);

export const getPosts = (...args: Parameters<typeof mockApi.getPosts>) =>
  activeApi().getPosts(...args);

export const getPost = (...args: Parameters<typeof mockApi.getPost>) =>
  activeApi().getPost(...args);

export const createPost = (...args: Parameters<typeof mockApi.createPost>) =>
  activeApi().createPost(...args);

export const toggleLike = (...args: Parameters<typeof mockApi.toggleLike>) =>
  activeApi().toggleLike(...args);

export const applyToPost = (...args: Parameters<typeof mockApi.applyToPost>) =>
  activeApi().applyToPost(...args);

export const acceptApplication = (
  ...args: Parameters<typeof mockApi.acceptApplication>
) => activeApi().acceptApplication(...args);

export const rejectApplication = (
  ...args: Parameters<typeof mockApi.rejectApplication>
) => activeApi().rejectApplication(...args);

export const getChatRooms = (...args: Parameters<typeof mockApi.getChatRooms>) =>
  activeApi().getChatRooms(...args);

export const getChatMessages = (
  ...args: Parameters<typeof mockApi.getChatMessages>
) => activeApi().getChatMessages(...args);

export const sendMessage = (...args: Parameters<typeof mockApi.sendMessage>) =>
  activeApi().sendMessage(...args);
