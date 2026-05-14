import { fireEvent, render, screen } from "@testing-library/react-native";

import App from "../App";

describe("App tabs", () => {
  it("switches between the main bottom-tab screens", async () => {
    render(<App />);

    fireEvent.press(await screen.findByTestId("auth-login-next"));
    expect(screen.getByText("여기서 검색")).toBeTruthy();

    fireEvent.press(screen.getByTestId("map-home-bottom-nav-bus"));
    expect(screen.getByText("가장 빠른 노선")).toBeTruthy();

    fireEvent.press(screen.getByTestId("route-bottom-nav-posts"));
    expect(screen.getByText("어떤 모집을 시작할까요?")).toBeTruthy();
    expect(screen.getByText("정기 라이딩")).toBeTruthy();

    fireEvent.press(screen.getByTestId("recruitment-back"));
    expect(screen.getByText("가장 빠른 노선")).toBeTruthy();

    fireEvent.press(screen.getByTestId("route-bottom-nav-chat"));
    expect(screen.getByText("지금 함께 이동할 대화를 확인하세요")).toBeTruthy();

    fireEvent.press(screen.getByTestId("chat-room-brungpot"));
    expect(screen.getByText("부릉팟")).toBeTruthy();

    fireEvent.press(screen.getByTestId("chat-room-back"));
    expect(screen.getByText("지금 함께 이동할 대화를 확인하세요")).toBeTruthy();

    fireEvent.press(screen.getByTestId("chat-bottom-nav-profile"));
    expect(screen.getByText("인증 완료")).toBeTruthy();

    fireEvent.press(screen.getByTestId("profile-stat-saved"));
    expect(screen.getByText("내 찜")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("뒤로가기"));
    expect(screen.getByText("인증 완료")).toBeTruthy();

    fireEvent.press(screen.getByTestId("profile-stat-recruitments"));
    expect(screen.getByText("내가 쓴 모집글")).toBeTruthy();

    fireEvent.press(screen.getByTestId("profile-subscreen-back"));
    expect(screen.getByText("인증 완료")).toBeTruthy();

    fireEvent.press(screen.getByTestId("profile-stat-completed"));
    expect(screen.getByText("지원서")).toBeTruthy();
    expect(screen.getByText("자기소개")).toBeTruthy();

    fireEvent.press(screen.getByLabelText("뒤로가기"));
    fireEvent.press(screen.getByTestId("profile-bottom-nav-map"));
    expect(screen.getByText("여기서 검색")).toBeTruthy();
  });
});
