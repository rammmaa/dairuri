import { fireEvent, render, screen } from "@testing-library/react-native";

import { ChatScreen } from "../screens/ChatScreen";

describe("ChatScreen", () => {
  it("renders the chat list first and opens the ride chat room", () => {
    render(<ChatScreen />);

    expect(screen.getAllByText("채팅").length).toBeGreaterThan(0);
    expect(screen.getByText("지금 함께 이동할 대화를 확인하세요")).toBeTruthy();
    expect(screen.getByTestId("chat-bottom-nav")).toBeTruthy();
    expect(screen.queryByText("2026년 5월 5일")).toBeNull();

    fireEvent.press(screen.getByTestId("chat-room-brungpot"));

    expect(screen.getByText("부릉팟")).toBeTruthy();
    expect(screen.getByText("다산 1동 → 범어 1동\n월,수 7:00~8:00")).toBeTruthy();
    expect(screen.getByText("김예린님 외 3명")).toBeTruthy();
    expect(screen.getByText("2026년 5월 5일")).toBeTruthy();
    expect(screen.getByText("채팅이 \n시작되었어요")).toBeTruthy();
    expect(screen.getByText("안녕하세요")).toBeTruthy();
    expect(screen.getByPlaceholderText("메시지 보내기")).toBeTruthy();
  });

  it("opens the more menu and confirms the leave-room modal can be cancelled", () => {
    render(<ChatScreen />);

    fireEvent.press(screen.getByTestId("chat-room-brungpot"));
    fireEvent.press(screen.getByTestId("chat-room-more"));

    expect(screen.getByText("매너 평가하기")).toBeTruthy();
    expect(screen.getByText("면허증, 자동차 보험 조회하기")).toBeTruthy();

    fireEvent.press(screen.getByText("방 나가기"));

    expect(screen.getByText(/채팅방을 나가면/)).toBeTruthy();

    fireEvent.press(screen.getByText("취소"));

    expect(screen.queryByText(/채팅방을 나가면/)).toBeNull();
  });

  it("switches chat list between all, ride, and work tabs and toggles unread filter", () => {
    render(<ChatScreen />);

    expect(screen.getByText("총 3개")).toBeTruthy();

    fireEvent.press(screen.getByTestId("chat-filter-ride"));
    expect(screen.getByTestId("chat-filter-ride").props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByText("부릉팟")).toBeTruthy();
    expect(screen.getByText("아침 셔틀 공유방")).toBeTruthy();
    expect(screen.queryByText("다로리 카페 같이 가요")).toBeNull();

    fireEvent.press(screen.getByTestId("chat-unread-filter"));
    expect(screen.getByTestId("chat-unread-filter").props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByText("총 1개")).toBeTruthy();
    expect(screen.queryByText("아침 셔틀 공유방")).toBeNull();

    fireEvent.press(screen.getByTestId("chat-filter-work"));
    expect(screen.getByText("다로리 카페 같이 가요")).toBeTruthy();
    expect(screen.queryByText("부릉팟")).toBeNull();
  });
});
