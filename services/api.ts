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
  if (env.NODE_ENV === "test") {
    return "mock";
  }

  if (env.EXPO_PUBLIC_DARORI_USE_MOCK_API === "true") {
    if (env.NODE_ENV === "production") {
      throw new Error("mock API mode is not allowed in production builds");
    }
    return "mock";
  }

  return "live";
}

const activeApi = () => (resolveApiMode() === "mock" ? mockApi : liveApi);

export const login = (...args: Parameters<typeof mockApi.login>) =>
  activeApi().login(...args);

export const signup = (...args: Parameters<typeof mockApi.signup>) =>
  activeApi().signup(...args);

export const checkLoginIdAvailability = (
  ...args: Parameters<typeof mockApi.checkLoginIdAvailability>
) => activeApi().checkLoginIdAvailability(...args);

export const requestPhoneVerification = (
  ...args: Parameters<typeof mockApi.requestPhoneVerification>
) => activeApi().requestPhoneVerification(...args);

export const confirmPhoneVerification = (
  ...args: Parameters<typeof mockApi.confirmPhoneVerification>
) => activeApi().confirmPhoneVerification(...args);

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

export const getApplicationDetail = (
  ...args: Parameters<typeof mockApi.getApplicationDetail>
) => activeApi().getApplicationDetail(...args);

export const getApplicationsForPost = (
  ...args: Parameters<typeof mockApi.getApplicationsForPost>
) => activeApi().getApplicationsForPost(...args);

export const acceptApplication = (
  ...args: Parameters<typeof mockApi.acceptApplication>
) => activeApi().acceptApplication(...args);

export const rejectApplication = (
  ...args: Parameters<typeof mockApi.rejectApplication>
) => activeApi().rejectApplication(...args);

export const getMe = (...args: Parameters<typeof mockApi.getMe>) =>
  activeApi().getMe(...args);

export const updateMe = (...args: Parameters<typeof mockApi.updateMe>) =>
  activeApi().updateMe(...args);

export const changePassword = (
  ...args: Parameters<typeof mockApi.changePassword>
) => activeApi().changePassword(...args);

export const deleteMe = (...args: Parameters<typeof mockApi.deleteMe>) =>
  activeApi().deleteMe(...args);

export const getMyPosts = (...args: Parameters<typeof mockApi.getMyPosts>) =>
  activeApi().getMyPosts(...args);

export const getSavedPosts = (...args: Parameters<typeof mockApi.getSavedPosts>) =>
  activeApi().getSavedPosts(...args);

export const getReceivedApplications = (
  ...args: Parameters<typeof mockApi.getReceivedApplications>
) => activeApi().getReceivedApplications(...args);

export const getChatRooms = (...args: Parameters<typeof mockApi.getChatRooms>) =>
  activeApi().getChatRooms(...args);

export const getChatMessages = (
  ...args: Parameters<typeof mockApi.getChatMessages>
) => activeApi().getChatMessages(...args);

export const sendMessage = (...args: Parameters<typeof mockApi.sendMessage>) =>
  activeApi().sendMessage(...args);

export const sendImageMessage = (
  ...args: Parameters<typeof mockApi.sendImageMessage>
) => activeApi().sendImageMessage(...args);

export const submitMannerRating = (
  ...args: Parameters<typeof mockApi.submitMannerRating>
) => activeApi().submitMannerRating(...args);

export const submitReport = (...args: Parameters<typeof mockApi.submitReport>) =>
  activeApi().submitReport(...args);

export const getBusRoutes = (...args: Parameters<typeof mockApi.getBusRoutes>) =>
  activeApi().getBusRoutes(...args);

export const getBusStops = (...args: Parameters<typeof mockApi.getBusStops>) =>
  activeApi().getBusStops(...args);

export const getBusRouteStops = (
  ...args: Parameters<typeof mockApi.getBusRouteStops>
) => activeApi().getBusRouteStops(...args);

export const getStopSightings = (
  ...args: Parameters<typeof mockApi.getStopSightings>
) => activeApi().getStopSightings(...args);

export const recordBusSighting = (
  ...args: Parameters<typeof mockApi.recordBusSighting>
) => activeApi().recordBusSighting(...args);
