import {
  categoryFilters,
  mapHomePosts,
  bottomNavItems,
} from "../data/mapHome";

describe("map home fixtures", () => {
  it("exposes the five recruitment posts shown on the home map", () => {
    expect(mapHomePosts).toHaveLength(5);
    expect(mapHomePosts[0]).toMatchObject({
      author: "다로리인",
      title: "다로리 카페 매주 같이 가실 분 구해요",
      originName: "다로리 카페",
    });
  });

  it("keeps category filters and bottom navigation labels in the Figma order", () => {
    expect(categoryFilters.map((filter) => filter.label)).toEqual([
      "라이드",
      "알바",
      "버스",
    ]);
    expect(bottomNavItems.map((item) => item.label)).toEqual([
      "지도",
      "버스",
      "모집글",
      "채팅",
      "프로필",
    ]);
  });
});
