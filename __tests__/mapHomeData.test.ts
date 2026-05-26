import {
  categoryFilters,
  mapDomainPostsToMapHomePosts,
  mapHomePosts,
  bottomNavItems,
} from "../data/mapHome";
import { mockPosts } from "../data/mockDomain";

describe("map home fixtures", () => {
  it("exposes the five recruitment posts shown on the home map", () => {
    expect(mapHomePosts).toHaveLength(5);
    expect(mapHomePosts[0]).toMatchObject({
      author: "다로리인",
      title: "다로리 카페 매주 같이 가실 분 구해요",
      originName: "다로리 카페",
    });
    expect(mapHomePosts.find((post) => post.category === "work")).toMatchObject({
      title: "농촌 일손과 카페 보조 도울 수 있어요",
      purpose: "가능 업무",
      originLabel: "활동 가능 지역",
    });
  });

  it("keeps category filters and bottom navigation labels in the Figma order", () => {
    expect(categoryFilters.map((filter) => filter.label)).toEqual([
      "라이드",
      "인력",
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

  it("maps live domain posts into map/archive recruitment cards", () => {
    expect(mapDomainPostsToMapHomePosts(mockPosts)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          detailPostId: "job-1",
          category: "work",
          title: "농촌 일손과 카페 보조 도울 수 있어요",
          purpose: "카페 보조 · 농번기 일손 · 아이 등하원 동행",
          originLabel: "활동 가능 지역",
          originName: "다로리 카페 인근",
        }),
        expect.objectContaining({
          detailPostId: "carpool-1",
          category: "ride",
          originLabel: "출발지",
          originName: "다로리 카페",
        }),
      ]),
    );
  });
});
