import { fireEvent, render, screen } from "@testing-library/react-native";

import { ApplicationReviewScreen } from "../screens/post/ApplicationReviewScreen";

describe("ApplicationReviewScreen", () => {
  it("renders the applicant profile, intro, and linked post", () => {
    render(<ApplicationReviewScreen applicationId="application-1" />);

    expect(screen.getByText("지원서")).toBeTruthy();
    expect(screen.getByText("다로리인")).toBeTruthy();
    expect(screen.getByText("010-0000-0000")).toBeTruthy();
    expect(screen.getByText("40.6°C")).toBeTruthy();
    expect(
      screen.getByText(
        "시간 약속을 잘 지키고 같은 방향으로 자주 이동합니다. 조용히 이동하는 편이라 부담 없으실 거예요.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("‘청도감 학원’ 함께 다니실 사람 구해요")).toBeTruthy();
  });

  it("opens and closes the approval completion modal", () => {
    render(<ApplicationReviewScreen applicationId="application-1" />);

    fireEvent.press(screen.getByTestId("application-approve-button"));

    expect(screen.getByText("승인 완료")).toBeTruthy();
    expect(screen.getByText("지원자를 승인했습니다.")).toBeTruthy();

    fireEvent.press(screen.getByTestId("application-approval-confirm"));

    expect(screen.queryByText("승인 완료")).toBeNull();
  });

  it("keeps rejection submit disabled until a valid reason and then shows completion", () => {
    render(<ApplicationReviewScreen applicationId="application-1" />);

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

    expect(screen.getByText("매칭 신청 반려")).toBeTruthy();
    expect(screen.getByText("지원자에게 반려 알림을 보냈습니다.")).toBeTruthy();
  });
});
