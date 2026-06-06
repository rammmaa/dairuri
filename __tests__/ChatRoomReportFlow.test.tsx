import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Linking, Platform, Share } from "react-native";

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock("../services/api", () => {
  const actual = jest.requireActual("../services/api");

  return {
    ...actual,
    leaveChatRoom: jest.fn((...args) => actual.leaveChatRoom(...args)),
    sendImageMessage: jest.fn((...args) => actual.sendImageMessage(...args)),
    sendMessage: jest.fn((...args) => actual.sendMessage(...args)),
    submitReport: jest.fn(),
  };
});

import * as ImagePicker from "expo-image-picker";
import * as api from "../services/api";
import { mockChatRooms } from "../data/mockDomain";
import { ChatRoomScreen } from "../screens/chat/ChatRoomScreen";
import { ReportScreen } from "../screens/chat/ReportScreen";
import { resetMockDatabase } from "../services/mockDb";

const mockedApi = api as typeof api & {
  leaveChatRoom: jest.Mock;
  sendImageMessage: jest.Mock;
  sendMessage: jest.Mock;
  submitReport: jest.Mock;
};

describe("Chat room and report flow", () => {
  beforeEach(() => {
    resetMockDatabase();
    jest.restoreAllMocks();
    mockedApi.leaveChatRoom.mockClear();
    mockedApi.sendImageMessage.mockClear();
    mockedApi.sendMessage.mockClear();
    mockedApi.submitReport.mockClear();
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    jest.spyOn(Share, "share").mockResolvedValue({
      action: "sharedAction",
    } as never);
  });

  it("renders the chat room header, messages, and composer", async () => {
    render(<ChatRoomScreen roomId="room-1" />);

    expect(screen.getByText("‘청도감 학원’ 함께 다니실 사람 구해요")).toBeTruthy();
    expect(screen.queryByText("남성현역 > 청도명어학원 / 화, 목 16:00")).toBeNull();
    expect(await screen.findByText("매칭이 시작되었습니다.")).toBeTruthy();
    expect(screen.getByText("안녕하세요. 오늘도 같은 장소에서 만나면 될까요?")).toBeTruthy();
    expect(screen.getByPlaceholderText("메시지 보내기")).toBeTruthy();
  });

  it("keeps the composer inside a keyboard avoiding container", () => {
    render(<ChatRoomScreen roomId="room-1" />);

    expect(screen.getByTestId("chat-room-keyboard-avoiding-view")).toBeTruthy();
    expect(screen.getByTestId("chat-room-message-list").props.keyboardDismissMode).toBe(
      Platform.OS === "ios" ? "interactive" : "on-drag",
    );
    expect(screen.getByTestId("chat-room-message-list").props.keyboardShouldPersistTaps).toBe(
      "handled",
    );

    const input = screen.getByTestId("chat-room-message-input");
    expect(input.props.returnKeyType).toBe("send");
    expect(input.props.blurOnSubmit).toBe(true);
  });

  it("sends the message when return is pressed and clears the composer", async () => {
    render(<ChatRoomScreen roomId="room-1" />);

    const input = screen.getByTestId("chat-room-message-input");
    fireEvent.changeText(input, "엔터로 보낼게요");
    fireEvent(input, "submitEditing");

    expect(await screen.findByText("엔터로 보낼게요")).toBeTruthy();
    expect(screen.getByTestId("chat-room-message-input").props.value).toBe("");
  });

  it("sends a non-empty message and clears the composer", async () => {
    render(<ChatRoomScreen roomId="room-1" />);

    const input = screen.getByPlaceholderText("메시지 보내기");
    fireEvent.changeText(input, "  지금 출발할게요  ");
    fireEvent.press(screen.getByTestId("chat-send-button"));

    expect(await screen.findByText("지금 출발할게요")).toBeTruthy();
    expect(screen.getByPlaceholderText("메시지 보내기").props.value).toBe("");
  });

  it("keeps photo attachment feedback near the composer and sends an image message", async () => {
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValueOnce({
      granted: true,
    } as never);
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file:///photo.jpg",
          base64: "abc",
          mimeType: "image/jpeg",
        },
      ],
    } as never);

    render(<ChatRoomScreen roomId="room-1" />);

    fireEvent.press(screen.getByTestId("chat-attach-photo-button"));

    expect(await screen.findByTestId("chat-attachment-preview")).toBeTruthy();
    expect(screen.queryByText("사진을 첨부했어요.")).toBeNull();

    fireEvent.press(screen.getByTestId("chat-send-button"));

    await waitFor(() => {
      expect(mockedApi.sendImageMessage).toHaveBeenCalledWith(
        "room-1",
        "data:image/jpeg;base64,abc",
        undefined,
      );
    });
  });

  it("opens a full-screen preview when a chat image is pressed", () => {
    render(<ChatRoomScreen roomId="room-1" />);

    fireEvent.press(screen.getByTestId("chat-message-image-message-image-1"));

    expect(screen.getByTestId("chat-image-preview")).toBeTruthy();
    expect(screen.getByLabelText("사진 미리보기 닫기")).toBeTruthy();
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

  it("opens the other participant phone number from the header call button", async () => {
    const openURL = jest.mocked(Linking.openURL);

    render(<ChatRoomScreen roomId="room-1" />);

    fireEvent.press(screen.getByLabelText("전화하기"));

    await waitFor(() => {
      expect(openURL).toHaveBeenCalledWith("tel:010-1234-4567");
    });
  });

  it("shows phone call status when the other participant has no phone number", () => {
    const openURL = jest.mocked(Linking.openURL);
    openURL.mockClear();
    const originalParticipants = mockChatRooms[0].participants;
    mockChatRooms[0].participants = [
      originalParticipants[0],
      { ...originalParticipants[1], phone: "" },
    ];

    try {
      render(<ChatRoomScreen roomId="room-1" />);

      fireEvent.press(screen.getByLabelText("전화하기"));

      expect(screen.getByText("상대방 전화번호가 등록되어 있지 않아요.")).toBeTruthy();
      expect(openURL).not.toHaveBeenCalled();
    } finally {
      mockChatRooms[0].participants = originalParticipants;
    }
  });

  it("opens the more sheet and calls report with the current room id", () => {
    const onReport = jest.fn();

    render(<ChatRoomScreen roomId="room-1" onReport={onReport} />);

    fireEvent.press(screen.getByTestId("chat-room-more-button"));
    expect(screen.getByTestId("chat-more-bottom-sheet")).toBeTruthy();
    expect(screen.getByText("매너 평가하기")).toBeTruthy();
    expect(screen.getByText("운전자 인증 확인하기")).toBeTruthy();
    expect(screen.getByText("아는 사용자 초대하기")).toBeTruthy();
    expect(screen.getByText("검색하기")).toBeTruthy();
    expect(screen.getByText("알림끄기")).toBeTruthy();
    expect(screen.getByText("닫기")).toBeTruthy();

    fireEvent.press(screen.getByTestId("chat-more-report"));

    expect(onReport).toHaveBeenCalledWith("room-1");
    expect(screen.queryByTestId("chat-more-bottom-sheet")).toBeNull();
  });

  it("handles the non-report more-sheet actions in the chat room", async () => {
    render(<ChatRoomScreen roomId="room-1" />);

    fireEvent.press(screen.getByTestId("chat-room-more-button"));
    fireEvent.press(screen.getByText("매너 평가하기"));
    expect(screen.getByText("매너 평가하기")).toBeTruthy();
    expect(screen.getByText("좋았던 항목을 선택해주세요.")).toBeTruthy();
    fireEvent.press(screen.getByText("시간 약속을 잘 지켰어요"));
    await waitFor(() => {
      expect(screen.getByText("매너 평가가 저장되었습니다.")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("확인"));

    fireEvent.press(screen.getByTestId("chat-room-more-button"));
    fireEvent.press(screen.getByText("운전자 인증 확인하기"));
    expect(screen.getByText("운전자 인증")).toBeTruthy();
    expect(screen.getByText("인증됨")).toBeTruthy();
    fireEvent.press(screen.getByText("확인"));

    fireEvent.press(screen.getByTestId("chat-room-more-button"));
    fireEvent.press(screen.getByText("아는 사용자 초대하기"));
    expect(screen.getByText("초대 링크가 준비되었습니다.")).toBeTruthy();
    expect(screen.getByText("darori.chat/room-1")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText("초대 링크를 공유했어요.")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("확인"));

    fireEvent.press(screen.getByTestId("chat-room-more-button"));
    fireEvent.press(screen.getByText("검색하기"));
    fireEvent.changeText(screen.getByTestId("chat-room-search-input"), "정문");
    expect(screen.getByText("1개 메시지")).toBeTruthy();
    expect(screen.queryByText("안녕하세요. 오늘도 같은 장소에서 만나면 될까요?")).toBeNull();

    fireEvent.press(screen.getByTestId("chat-room-more-button"));
    fireEvent.press(screen.getByText("알림끄기"));
    expect(screen.getByText("이 채팅방 알림을 껐어요.")).toBeTruthy();

    fireEvent.press(screen.getByTestId("chat-room-more-button"));
    expect(screen.getByText("알림켜기")).toBeTruthy();
  });

  it("shares the invite link and keeps the invite confirmation visible", async () => {
    const share = jest.mocked(Share.share);
    share.mockClear();
    share.mockResolvedValueOnce({
      action: "sharedAction",
    } as never);

    render(<ChatRoomScreen roomId="room-1" />);

    fireEvent.press(screen.getByTestId("chat-room-more-button"));
    fireEvent.press(screen.getByText("아는 사용자 초대하기"));

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("darori.chat/room-1"),
          title: "‘청도감 학원’ 함께 다니실 사람 구해요",
          url: "darori.chat/room-1",
        }),
      );
    });
    expect(screen.getByText("초대 링크를 공유했어요.")).toBeTruthy();
    expect(screen.getByText("darori.chat/room-1")).toBeTruthy();
  });

  it("opens the leave-room confirmation from the more sheet", () => {
    render(<ChatRoomScreen roomId="room-1" />);

    fireEvent.press(screen.getByTestId("chat-room-more-button"));
    fireEvent.press(screen.getByTestId("chat-more-leave"));

    expect(screen.getByTestId("chat-leave-confirm")).toBeTruthy();
    expect(screen.getByText("채팅방을 나가시겠어요?")).toBeTruthy();
    expect(screen.getByText("채팅목록 및 대화 내용이 삭제되고 복구할 수 없어요.")).toBeTruthy();
  });

  it("leaves the room through the chat API before navigating back", async () => {
    const onBack = jest.fn();
    mockedApi.leaveChatRoom.mockResolvedValueOnce(undefined);

    render(<ChatRoomScreen roomId="room-1" onBack={onBack} />);

    fireEvent.press(screen.getByTestId("chat-room-more-button"));
    fireEvent.press(screen.getByTestId("chat-more-leave"));
    fireEvent.press(screen.getByText("네, 나갈래요"));

    await waitFor(() => {
      expect(mockedApi.leaveChatRoom).toHaveBeenCalledWith("room-1");
    });
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("keeps the user in the room when leaving fails", async () => {
    const onBack = jest.fn();
    mockedApi.leaveChatRoom.mockRejectedValueOnce(new Error("leave failed"));

    render(<ChatRoomScreen roomId="room-1" onBack={onBack} />);

    fireEvent.press(screen.getByTestId("chat-room-more-button"));
    fireEvent.press(screen.getByTestId("chat-more-leave"));
    fireEvent.press(screen.getByText("네, 나갈래요"));

    await waitFor(() => {
      expect(screen.getByText("leave failed")).toBeTruthy();
    });
    expect(onBack).not.toHaveBeenCalled();
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
    expect(screen.getByText("접수된 내용은 다로링크 운영팀이 확인할게요.")).toBeTruthy();
    expect(screen.queryByText("접수된 내용은 다로리 운영팀이 확인할게요.")).toBeNull();
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
