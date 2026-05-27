import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import App from "../App";

// expo-location is a native module that has no jest implementation. BusSightingScreen
// imports it, so loading App pulls it in even when this test does not exercise the
// sighting flow directly. Provide a minimal stub up front.
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

describe("App tabs", () => {
  it("switches between the main bottom-tab screens", async () => {
    render(<App />);

    fireEvent.press(await screen.findByTestId("auth-login-next"));
    await waitFor(() => {
      expect(screen.getByText("여기서 검색")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("map-home-bottom-nav-bus"));
    expect(await screen.findByText("추천 경로")).toBeTruthy();

    // Pushing the record-sighting button opens the BusSightingScreen sub-screen,
    // and tapping the back affordance returns to the bus tab.
    fireEvent.press(screen.getByTestId("route-record-sighting-button"));
    expect(await screen.findByText("방금 버스 봤어요!")).toBeTruthy();
    fireEvent.press(screen.getByLabelText("뒤로가기"));
    expect(await screen.findByText("추천 경로")).toBeTruthy();

    fireEvent.press(screen.getByTestId("route-bottom-nav-posts"));
    expect(screen.getByText("어떤 모집을 시작할까요?")).toBeTruthy();
    expect(screen.getByText("정기 라이딩")).toBeTruthy();

    fireEvent.press(screen.getByTestId("recruitment-back"));
    expect(await screen.findByText("추천 경로")).toBeTruthy();

    fireEvent.press(screen.getByTestId("route-bottom-nav-chat"));
    expect(screen.getByText("지금 함께 이동할 대화를 확인하세요")).toBeTruthy();

    fireEvent.press(screen.getByTestId("chat-room-brungpot"));
    expect(screen.getByText("부릉팟")).toBeTruthy();

    fireEvent.press(screen.getByTestId("chat-room-back"));
    expect(screen.getByText("지금 함께 이동할 대화를 확인하세요")).toBeTruthy();

    fireEvent.press(screen.getByTestId("chat-bottom-nav-profile"));
    expect(screen.getByText("매너온도")).toBeTruthy();

    fireEvent.press(screen.getByTestId("profile-edit-button"));
    expect(screen.getByText("운전 여부")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("뒤로가기"));
    expect(screen.getByText("매너온도")).toBeTruthy();

    fireEvent.press(screen.getByText("설정"));
    expect(screen.getByText("전화번호")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("뒤로가기"));
    expect(screen.getByText("매너온도")).toBeTruthy();

    fireEvent.press(screen.getByTestId("profile-bottom-nav-map"));
    expect(screen.getByText("여기서 검색")).toBeTruthy();
  });
});
