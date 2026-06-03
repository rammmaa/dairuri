import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Share } from "react-native";

jest.mock("../services/api", () => {
  const actual = jest.requireActual("../services/api");

  return {
    ...actual,
    applyToPost: jest.fn((...args) => actual.applyToPost(...args)),
  };
});

import { PostDetailScreen } from "../screens/post/PostDetailScreen";
import * as api from "../services/api";

describe("PostDetailScreen", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.mocked(api.applyToPost).mockImplementation((...args) => {
      const actual = jest.requireActual("../services/api");
      return actual.applyToPost(...args);
    });
  });

  it("renders a resource profile detail with pay-only metadata", () => {
    render(<PostDetailScreen postId="job-1" />);

    expect(screen.getByText("알바")).toBeTruthy();
    expect(screen.getByText("우리마이사랑해")).toBeTruthy();
    expect(screen.getByText("80.0°C")).toBeTruthy();
    expect(
      screen.getByText("농촌 일손과 카페 보조 도울 수 있어요"),
    ).toBeTruthy();
    expect(screen.getByText("시급")).toBeTruthy();
    expect(screen.getByText("시급 12,000원부터")).toBeTruthy();
    expect(screen.queryByText("알바장소")).toBeNull();
    expect(screen.queryByText("다로리 카페 인근")).toBeNull();
    expect(screen.queryByText("근로시간")).toBeNull();
    expect(screen.queryByText("화, 목 09:00 - 15:00")).toBeNull();
    expect(screen.queryByText("카테고리")).toBeNull();
    expect(screen.queryByText("카페 보조 · 농번기 일손 · 아이 등하원 동행")).toBeNull();
  });

  it("renders a carpool detail with carpool-specific metadata", () => {
    render(<PostDetailScreen postId="carpool-1" />);

    expect(screen.getByText("라이딩")).toBeTruthy();
    expect(screen.getByText("출발장소")).toBeTruthy();
    expect(screen.getByText("다로리 카페")).toBeTruthy();
    expect(screen.getByText("도착장소")).toBeTruthy();
    expect(screen.getByText("청도명어학원")).toBeTruthy();
    expect(screen.getByText("출발시간")).toBeTruthy();
    expect(screen.getByText("화, 목 16:00 - 17:00")).toBeTruthy();
    expect(screen.queryByText("비용")).toBeNull();
    expect(screen.queryByText("3,000원")).toBeNull();
    expect(screen.getByText("모집인원")).toBeTruthy();
    expect(screen.getByText("3명")).toBeTruthy();
  });

  it("validates the apply steps and returns home after submission", async () => {
    const onSubmitted = jest.fn();

    render(<PostDetailScreen postId="job-1" onSubmitted={onSubmitted} />);

    fireEvent.press(screen.getByText("지원하기"));

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
      expect(screen.getByText("잘 제출되었어요!")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("apply-complete-button"));

    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("잘 제출되었어요!")).toBeNull();
  });

  it("does not let the current user apply to their own post", () => {
    render(<PostDetailScreen postId="carpool-1" />);

    expect(screen.getByText("내 모집글")).toBeTruthy();
    expect(screen.getByText("내가 작성한 모집글에는 지원할 수 없어요.")).toBeTruthy();
    expect(screen.queryByText("지원하기")).toBeNull();
  });

  it("shares the current post with a useful title and message", async () => {
    const shareSpy = jest.spyOn(Share, "share").mockResolvedValueOnce({
      action: Share.sharedAction,
    } as never);

    render(<PostDetailScreen postId="job-1" />);

    fireEvent.press(screen.getByLabelText("공유하기"));

    await waitFor(() => {
      expect(shareSpy).toHaveBeenCalledWith({
        title: "농촌 일손과 카페 보조 도울 수 있어요",
        message: expect.stringContaining("농촌 일손과 카페 보조 도울 수 있어요"),
        url: "dairuri://posts/job-1",
      });
    });
    expect(shareSpy.mock.calls[0][0].message).toContain("dairuri://posts/job-1");
  });

  it("shows non-blocking feedback when sharing fails", async () => {
    jest.spyOn(Share, "share").mockRejectedValueOnce(new Error("share failed"));

    render(<PostDetailScreen postId="job-1" />);

    fireEvent.press(screen.getByLabelText("공유하기"));

    expect(await screen.findByText("share failed")).toBeTruthy();
    expect(screen.getByText("지원하기")).toBeTruthy();
  });

  it("keeps the apply modal open and shows an error when application creation fails", async () => {
    jest
      .mocked(api.applyToPost)
      .mockRejectedValueOnce(new Error("이미 신청한 모집글입니다."));

    render(<PostDetailScreen postId="job-1" />);

    fireEvent.press(screen.getByText("지원하기"));
    fireEvent.changeText(
      screen.getByTestId("apply-intro-input"),
      "꼼꼼하게 시간 맞춰 참여할 수 있습니다.",
    );
    fireEvent.press(screen.getByTestId("apply-next-button"));
    fireEvent.press(screen.getByTestId("terms-all"));
    fireEvent.press(screen.getByTestId("apply-terms-confirm-button"));

    expect(await screen.findByText("이미 신청한 모집글입니다.")).toBeTruthy();
    expect(screen.queryByText("잘 제출되었어요!")).toBeNull();
  });
});
