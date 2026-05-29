import { render, screen } from "@testing-library/react-native";

jest.mock("expo-font", () => ({
  useFonts: () => [false],
}));

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

import App from "../App";

describe("App loading state", () => {
  it("does not render text before fixed app fonts are loaded", () => {
    render(<App />);

    expect(screen.queryByText("다로링크를 준비하고 있어요")).toBeNull();
    expect(screen.toJSON()).toMatchObject({
      type: "View",
    });
  });
});
