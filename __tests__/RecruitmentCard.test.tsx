import { render, screen } from "@testing-library/react-native";

import { RecruitmentCard } from "../components/RecruitmentCard";
import type { MapHomePost } from "../data/mapHome";

const basePost: MapHomePost = {
  id: "card-1",
  detailPostId: "post-1",
  category: "work",
  dayFilters: ["화"],
  timeFilter: "오후",
  createdMinutesAgo: 1,
  author: "테스트계정",
  title: "알바구해요",
  schedule: "토 · 화 16:00 - 18:00",
  purpose: "서비스 · 교육/강사",
  originLabel: "활동 가능 지역",
  originName: "청도역",
  createdAgo: "1분 전",
  liked: false,
};

describe("RecruitmentCard", () => {
  it("does not render the optional duration row when card data has no duration", () => {
    render(<RecruitmentCard post={basePost} />);

    expect(screen.getByText("토 · 화 16:00 - 18:00")).toBeTruthy();
    expect(screen.getByText("서비스 · 교육/강사")).toBeTruthy();
    expect(screen.queryByText("퇴근 시간")).toBeNull();
  });

  it("keeps the duration row for ride cards", () => {
    render(
      <RecruitmentCard
        post={{
          ...basePost,
          category: "ride",
          purpose: "라이드",
          duration: "퇴근 시간",
          originLabel: "출발지",
        }}
      />,
    );

    expect(screen.getByText("퇴근 시간")).toBeTruthy();
  });
});
