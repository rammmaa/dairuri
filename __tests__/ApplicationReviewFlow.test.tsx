import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { ApplicationReviewScreen } from "../screens/post/ApplicationReviewScreen";
import { resetMockDatabase } from "../services/mockDb";

describe("ApplicationReviewScreen", () => {
  beforeEach(() => {
    resetMockDatabase();
  });

  it("renders the carpool applicant profile and intro", () => {
    render(<ApplicationReviewScreen applicationId="application-1" />);

    expect(screen.getByText("프로필")).toBeTruthy();
    expect(screen.getByText("이름")).toBeTruthy();
    expect(screen.getByText("김진도")).toBeTruthy();
    expect(screen.getByText("전화번호")).toBeTruthy();
    expect(screen.getByText("010-1234-4567")).toBeTruthy();
    expect(screen.getByText("차종")).toBeTruthy();
    expect(screen.getByText("벤츠")).toBeTruthy();
    expect(
      screen.getByText(
        "시간 약속을 잘 지키고 같은 방향으로 자주 이동합니다. 조용히 이동하는 편이라 부담 없으실 거예요.",
      ),
    ).toBeTruthy();
  });

  it("opens the carpool approval modal and routes home or to the created chat", async () => {
    const onGoHome = jest.fn();
    const onOpenChat = jest.fn();

    render(
      <ApplicationReviewScreen
        applicationId="application-1"
        onGoHome={onGoHome}
        onOpenChat={onOpenChat}
      />,
    );

    fireEvent.press(screen.getByTestId("application-approve-button"));

    expect(await screen.findByText("승인 완료")).toBeTruthy();
    expect(screen.getByText("자동으로 채팅방에 초대되었어요.\n인사를 나눠보세요!")).toBeTruthy();
    expect(screen.getByText("홈으로")).toBeTruthy();
    expect(screen.getByText("채팅방 이동")).toBeTruthy();

    fireEvent.press(screen.getByTestId("application-approval-home"));
    expect(onGoHome).toHaveBeenCalledTimes(1);

    resetMockDatabase();
    onGoHome.mockClear();
    render(
      <ApplicationReviewScreen
        applicationId="application-1"
        onGoHome={onGoHome}
        onOpenChat={onOpenChat}
      />,
    );

    fireEvent.press(screen.getByTestId("application-approve-button"));

    expect(await screen.findByText("채팅방 이동")).toBeTruthy();
    fireEvent.press(screen.getByTestId("application-approval-chat"));
    expect(onOpenChat).toHaveBeenCalledWith("room-application-1");
  });

  it("keeps rejection submit disabled until a valid reason and then returns home", async () => {
    const onGoHome = jest.fn();

    render(<ApplicationReviewScreen applicationId="application-1" onGoHome={onGoHome} />);

    fireEvent.press(screen.getByTestId("application-reject-button"));

    const submitButton = screen.getByTestId("application-reject-submit");
    expect(screen.getByText("거절 사유를 작성해주세요.")).toBeTruthy();
    expect(submitButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.changeText(screen.getByTestId("application-reject-reason"), "짧음");
    expect(screen.getByTestId("application-reject-submit").props.accessibilityState.disabled).toBe(
      true,
    );

    fireEvent.changeText(
      screen.getByTestId("application-reject-reason"),
      "일정이 맞지 않습니다.",
    );
    expect(screen.getByTestId("application-reject-submit").props.accessibilityState.disabled).toBe(
      false,
    );

    fireEvent.press(screen.getByTestId("application-reject-submit"));

    expect(await screen.findByText("매칭 신청 반려")).toBeTruthy();
    expect(screen.getByText("지원자에게 반려 알림을 보냈습니다.")).toBeTruthy();

    fireEvent.press(screen.getByTestId("application-rejected-confirm"));
    expect(onGoHome).toHaveBeenCalledTimes(1);
  });
});
