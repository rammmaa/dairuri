import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { PostDetailScreen } from "../screens/post/PostDetailScreen";

describe("PostDetailScreen", () => {
  it("renders a resource profile detail with seeker-specific metadata", () => {
    render(<PostDetailScreen postId="job-1" />);

    expect(screen.getByText("인적 자원")).toBeTruthy();
    expect(screen.getByText("우리마이사랑해")).toBeTruthy();
    expect(screen.getByText("80°C")).toBeTruthy();
    expect(
      screen.getByText("농촌 일손과 카페 보조 도울 수 있어요"),
    ).toBeTruthy();
    expect(screen.getByText("활동 가능 지역")).toBeTruthy();
    expect(screen.getByText("다로리 카페 인근")).toBeTruthy();
    expect(screen.getByText("희망 급여")).toBeTruthy();
    expect(screen.getByText("시급 12,000원부터")).toBeTruthy();
    expect(screen.getByText("가능 시간")).toBeTruthy();
    expect(screen.getByText("화, 목 09:00 - 15:00")).toBeTruthy();
    expect(screen.getByText("가능 업무")).toBeTruthy();
    expect(screen.getByText("카페 보조 · 농번기 일손 · 아이 등하원 동행")).toBeTruthy();
  });

  it("renders a carpool detail with carpool-specific metadata", () => {
    render(<PostDetailScreen postId="carpool-1" />);

    expect(screen.getByText("정기 라이딩")).toBeTruthy();
    expect(screen.getByText("출발장소")).toBeTruthy();
    expect(screen.getByText("다로리 카페")).toBeTruthy();
    expect(screen.getByText("도착장소")).toBeTruthy();
    expect(screen.getByText("청도명어학원")).toBeTruthy();
    expect(screen.getByText("출발시간")).toBeTruthy();
    expect(screen.getByText("화, 목 16:00 - 17:00")).toBeTruthy();
    expect(screen.getByText("비용")).toBeTruthy();
    expect(screen.getByText("3,000원")).toBeTruthy();
    expect(screen.getByText("모집인원")).toBeTruthy();
    expect(screen.getByText("3명")).toBeTruthy();
  });

  it("validates the apply steps and completes through the modal", async () => {
    const onOpenChat = jest.fn();

    render(<PostDetailScreen postId="job-1" onOpenChat={onOpenChat} />);

    fireEvent.press(screen.getByText("연락하기"));

    expect(screen.getByText("연락 내용을 작성해주세요")).toBeTruthy();
    expect(screen.getByTestId("apply-next-button").props.accessibilityState.disabled).toBe(
      true,
    );

    fireEvent.changeText(
      screen.getByTestId("apply-intro-input"),
      "꼼꼼하게 시간 맞춰 참여할 수 있습니다.",
    );
    expect(screen.getByTestId("apply-next-button").props.accessibilityState.disabled).toBe(
      false,
    );

    fireEvent.press(screen.getByTestId("apply-next-button"));

    expect(screen.getAllByText("약관 동의").length).toBeGreaterThan(0);
    expect(
      screen.getByTestId("apply-terms-confirm-button").props.accessibilityState.disabled,
    ).toBe(true);

    fireEvent.press(screen.getByTestId("terms-service"));
    fireEvent.press(screen.getByTestId("terms-privacy"));
    fireEvent.press(screen.getByTestId("terms-third-party"));

    expect(
      screen.getByTestId("apply-terms-confirm-button").props.accessibilityState.disabled,
    ).toBe(false);

    fireEvent.press(screen.getByTestId("apply-terms-confirm-button"));

    await waitFor(() => {
      expect(screen.getAllByText("연락 요청 완료").length).toBeGreaterThan(0);
    });

    fireEvent.press(screen.getByTestId("apply-complete-button"));

    expect(onOpenChat).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("연락 요청 완료")).toBeNull();
  });
});
