import { render, screen } from "@testing-library/react-native";

import { mockMe } from "../data/mockDomain";

jest.mock("expo-location", () => ({
  PermissionStatus: { GRANTED: "granted", DENIED: "denied", UNDETERMINED: "undetermined" },
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({
    status: "denied",
    granted: false,
    canAskAgain: true,
    expires: "never",
  }),
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: () => undefined }),
}));

jest.mock("../services/authSession", () => {
  const actual = jest.requireActual("../services/authSession");

  return {
    ...actual,
    hasAuthSession: jest.fn(() => false),
    restoreAuthSession: jest.fn(async () => ({
      token: "persisted-session-token",
      user: mockMe,
    })),
  };
});

import App from "../App";

describe("App auth restore", () => {
  it("opens the authenticated app when a persisted session exists", async () => {
    render(<App />);

    expect(await screen.findByText("여기서 검색")).toBeTruthy();
  });
});
