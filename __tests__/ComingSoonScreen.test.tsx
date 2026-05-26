import { fireEvent, render, screen } from "@testing-library/react-native";

import { ComingSoonScreen } from "../components/ComingSoonScreen";

describe("ComingSoonScreen", () => {
  it("renders the title, heading, optional subheading, and optional hint", () => {
    render(
      <ComingSoonScreen
        title="노선 정보"
        heading="노선별 지도와 방향 정보"
        subheading="곧 보여드릴게요."
        hint="이 화면은 Phase 2에서 채워집니다."
      />,
    );
    expect(screen.getByText("노선 정보")).toBeTruthy();
    expect(screen.getByText("노선별 지도와 방향 정보")).toBeTruthy();
    expect(screen.getByText("곧 보여드릴게요.")).toBeTruthy();
    expect(screen.getByText("이 화면은 Phase 2에서 채워집니다.")).toBeTruthy();
  });

  it("calls onBack when the header back affordance is pressed", () => {
    const onBack = jest.fn();
    render(
      <ComingSoonScreen
        title="아카이빙 보기"
        heading="호선별 기록 히스토리"
        onBack={onBack}
      />,
    );
    fireEvent.press(screen.getByLabelText("뒤로가기"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
