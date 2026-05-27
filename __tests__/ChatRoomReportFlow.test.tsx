import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

jest.mock("../services/api", () => {
  const actual = jest.requireActual("../services/api");

  return {
    ...actual,
    sendMessage: jest.fn((...args) => actual.sendMessage(...args)),
    submitReport: jest.fn(),
  };
});

import * as api from "../services/api";
import { ChatRoomScreen } from "../screens/chat/ChatRoomScreen";
import { ReportScreen } from "../screens/chat/ReportScreen";

const mockedApi = api as typeof api & {
  submitReport: jest.Mock;
};

describe("Chat room and report flow", () => {
  it("renders the chat room header, messages, and composer", async () => {
    render(<ChatRoomScreen roomId="room-1" />);

    expect(screen.getByText("부릉팟")).toBeTruthy();
    expect(screen.getByText("남성현역 > 청도명어학원 / 화, 목 16:00")).toBeTruthy();
    expect(await screen.findByText("매칭이 시작되었습니다.")).toBeTruthy();
    expect(screen.getByText("안녕하세요. 오늘도 같은 장소에서 만나면 될까요?")).toBeTruthy();
    expect(screen.getByPlaceholderText("메시지 보내기")).toBeTruthy();
  });

  it("sends a non-empty message and clears the composer", async () => {
    render(<ChatRoomScreen roomId="room-1" />);

    const input = screen.getByPlaceholderText("메시지 보내기");
    fireEvent.changeText(input, "  지금 출발할게요  ");
    fireEvent.press(screen.getByTestId("chat-send-button"));

    expect(await screen.findByText("지금 출발할게요")).toBeTruthy();
    expect(screen.getByPlaceholderText("메시지 보내기").props.value).toBe("");
  });

  it("keeps message text when sending fails", async () => {
    jest.mocked(api.sendMessage).mockRejectedValueOnce(new Error("send failed"));

    render(<ChatRoomScreen roomId="room-1" />);

    const input = screen.getByPlaceholderText("메시지 보내기");
    fireEvent.changeText(input, "  지금 출발할게요  ");
    fireEvent.press(screen.getByTestId("chat-send-button"));

    await waitFor(() => {
      expect(screen.getByText("send failed")).toBeTruthy();
    });

    expect(screen.getByPlaceholderText("메시지 보내기").props.value).toBe(
      "  지금 출발할게요  ",
    );
  });

  it("opens the more sheet and calls report with the current room id", () => {
    const onReport = jest.fn();

    render(<ChatRoomScreen roomId="room-1" onReport={onReport} />);

    fireEvent.press(screen.getByTestId("chat-room-more-button"));
    expect(screen.getByTestId("chat-more-bottom-sheet")).toBeTruthy();

    fireEvent.press(screen.getByTestId("chat-more-report"));

    expect(onReport).toHaveBeenCalledWith("room-1");
    expect(screen.queryByTestId("chat-more-bottom-sheet")).toBeNull();
  });

  it("opens the leave-room confirmation from the more sheet", () => {
    render(<ChatRoomScreen roomId="room-1" />);

    fireEvent.press(screen.getByTestId("chat-room-more-button"));
    fireEvent.press(screen.getByTestId("chat-more-leave"));

    expect(screen.getByTestId("chat-leave-confirm")).toBeTruthy();
    expect(screen.getByText("채팅방을 나가시겠어요?")).toBeTruthy();
    expect(screen.getByText("채팅목록 및 대화 내용이 삭제되고 복구할 수 없어요.")).toBeTruthy();
  });

  it("selects a report reason and submits the report", async () => {
    const onSubmitted = jest.fn();
    mockedApi.submitReport.mockResolvedValueOnce(undefined);

    render(<ReportScreen roomId="room-1" onSubmitted={onSubmitted} />);

    expect(screen.getByTestId("report-submit-button").props.accessibilityState).toMatchObject({
      disabled: true,
    });

    fireEvent.press(screen.getByText("욕설 및 비매너 사용"));

    expect(screen.getByTestId("report-submit-button").props.accessibilityState).toMatchObject({
      disabled: false,
    });

    fireEvent.press(screen.getByTestId("report-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("신고가 접수되었습니다")).toBeTruthy();
    });
    expect(mockedApi.submitReport).toHaveBeenCalledWith("room-1", "욕설 및 비매너 사용");
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  it("keeps the report form open when submission fails", async () => {
    const onSubmitted = jest.fn();
    mockedApi.submitReport.mockRejectedValueOnce(new Error("report failed"));

    render(<ReportScreen roomId="room-1" onSubmitted={onSubmitted} />);

    fireEvent.press(screen.getByText("욕설 및 비매너 사용"));
    fireEvent.press(screen.getByTestId("report-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("report failed")).toBeTruthy();
    });

    expect(screen.queryByText("신고가 접수되었습니다")).toBeNull();
    expect(screen.getByTestId("report-submit-button").props.accessibilityState).toMatchObject({
      disabled: false,
    });
    expect(onSubmitted).not.toHaveBeenCalled();
  });
});
