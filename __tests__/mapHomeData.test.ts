import {
  weekdayFilterOptions,
  categoryFilters,
  mapDomainPostsToMapHomePosts,
  mapHomePosts,
  bottomNavItems,
  timeFilterOptions,
} from "../data/mapHome";
import { mockPosts } from "../data/mockDomain";

describe("map home fixtures", () => {
  it("exposes the five recruitment posts shown on the home map", () => {
    expect(mapHomePosts).toHaveLength(5);
    expect(mapHomePosts[0]).toMatchObject({
      author: "다로리인",
      title: "다로리 카페 매주 같이 가실 분 구해요",
      originName: "다로리 카페",
      dayFilters: ["화", "목"],
    });
    expect(mapHomePosts.find((post) => post.category === "work")).toMatchObject({
      title: "농촌 일손과 카페 보조 도울 수 있어요",
      purpose: "가능 업무",
      originLabel: "활동 가능 지역",
    });
  });

  it("keeps category filters and bottom navigation labels in the Figma order", () => {
    expect(weekdayFilterOptions).toEqual([
      "월",
      "화",
      "수",
      "목",
      "금",
      "토",
      "일",
    ]);
    expect(timeFilterOptions).toEqual(["오전", "오후"]);
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
          dayFilters: ["화", "목"],
        }),
        expect.objectContaining({
          detailPostId: "carpool-1",
          category: "ride",
          originLabel: "출발지",
          originName: "다로리 카페",
          marker: {
            latitude: 35.6482,
            longitude: 128.7358,
          },
        }),
      ]),
    );
  });

  it("uses resource profile place coordinates for map markers", () => {
    const resourcePost = mockPosts.find((post) => post.type === "job");

    expect(resourcePost).toBeTruthy();
    expect(
      mapDomainPostsToMapHomePosts([
        {
          ...resourcePost!,
          id: "job-custom-place",
          placeName: "새 활동 지역",
          placeCoordinate: {
            latitude: 35.6512,
            longitude: 128.7391,
          },
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        detailPostId: "job-custom-place",
        category: "work",
        originName: "새 활동 지역",
        marker: {
          latitude: 35.6512,
          longitude: 128.7391,
        },
      }),
    ]);
  });

  it("uses availability note as the only resource card time label", () => {
    const resourcePost = mockPosts.find((post) => post.type === "job");

    expect(resourcePost).toBeTruthy();
    const [card] = mapDomainPostsToMapHomePosts([
      {
        ...resourcePost!,
        availabilityNote: "토 · 화 16:00 - 18:00",
      },
    ]);

    expect(card.schedule).toBe("토 · 화 16:00 - 18:00");
    expect(card.duration).toBeUndefined();
  });

  it("uses schedule note as the only ride card time label", () => {
    const ridePost = mockPosts.find((post) => post.type === "carpool");

    expect(ridePost).toBeTruthy();
    const [card] = mapDomainPostsToMapHomePosts([
      {
        ...ridePost!,
        scheduleNote: "토 · 화 16:00 - 18:00",
      },
    ]);

    expect(card.schedule).toBe("토 · 화 16:00 - 18:00");
    expect(card.duration).toBeUndefined();
  });
});
