import { normalizeCreatePostInput } from "../server/api/repository";

describe("server create post input", () => {
  it("normalizes a carpool post payload for PostgreSQL insertion", () => {
    expect(
      normalizeCreatePostInput(
        {
          type: "carpool",
          title: "같이 이동해요",
          body: "정기적으로 같이 이동할 분을 구합니다.",
          departure: "남성현역",
          destination: "청도명어학원",
          days: ["화", "목"],
          startTime: "16:00",
          price: 3000,
          seats: 3,
        },
        {
          id: "post-test",
          authorId: "me",
          createdAt: "2026-05-14T00:00:00.000Z",
        },
      ),
    ).toMatchObject({
      id: "post-test",
      type: "carpool",
      title: "같이 이동해요",
      authorId: "me",
      departure: "남성현역",
      destination: "청도명어학원",
      placeName: null,
      price: null,
      wageAmount: null,
      createdAt: "2026-05-14T00:00:00.000Z",
    });
  });

  it("normalizes a resource profile payload with human-resource fields", () => {
    expect(
      normalizeCreatePostInput(
        {
          type: "job",
          profileMode: "resource",
          title: "농촌 일손과 카페 보조 가능",
          body: "카운터와 농번기 일손을 도울 수 있어요.",
          placeName: "다로리 일대",
          placeCoordinate: {
            latitude: 35.6474,
            longitude: 128.7338,
          },
          days: ["화", "목"],
          startTime: "09:00",
          endTime: "15:00",
          wageType: "hourly",
          wageAmount: 123123,
          jobCategory: "유통/판매 · 생산/건설",
          availableTasks: ["유통/판매", "생산/건설"],
          employmentTypes: ["partTime", "shortTerm"],
          preferredPay: "시간당 123,123원",
          availabilityNote: "화 · 목 09:00 - 15:00",
          contactNote: "문자로 먼저 연락주세요.",
        },
        {
          id: "post-resource",
          authorId: "me",
          createdAt: "2026-05-25T00:00:00.000Z",
        },
      ),
    ).toMatchObject({
      id: "post-resource",
      type: "job",
      profileMode: "resource",
      placeName: "다로리 일대",
      placeLatitude: 35.6474,
      placeLongitude: 128.7338,
      wageType: "hourly",
      wageAmount: 123123,
      jobCategory: "유통/판매 · 생산/건설",
      availableTasks: ["유통/판매", "생산/건설"],
      employmentTypes: ["partTime", "shortTerm"],
      preferredPay: "시간당 123,123원",
      availabilityNote: "화 · 목 09:00 - 15:00",
      contactNote: "문자로 먼저 연락주세요.",
    });
  });

  it("rejects post payloads without type-specific required fields", () => {
    expect(() =>
      normalizeCreatePostInput(
        {
          type: "job",
          title: "인재 풀 등록",
          body: "등원 도우미를 구합니다.",
          days: ["월"],
          startTime: "09:00",
          endTime: "10:00",
          wageType: "hourly",
        },
        {
          id: "post-test",
          authorId: "me",
          createdAt: "2026-05-14T00:00:00.000Z",
        },
      ),
    ).toThrow("job post requires placeName and wageAmount");
  });

  it("rejects text fields with non-text values", () => {
    expect(() =>
      normalizeCreatePostInput(
        {
          type: "carpool",
          title: 123 as never,
          body: "정기적으로 같이 이동할 분을 구합니다.",
          departure: "남성현역",
          destination: "청도명어학원",
        },
        {
          id: "post-test",
          authorId: "me",
          createdAt: "2026-05-14T00:00:00.000Z",
        },
      ),
    ).toThrow("title must be text");
  });

  it("rejects numeric fields with non-number values", () => {
    expect(() =>
      normalizeCreatePostInput(
        {
          type: "carpool",
          title: "같이 이동해요",
          body: "정기적으로 같이 이동할 분을 구합니다.",
          departure: "남성현역",
          destination: "청도명어학원",
          seats: "3" as never,
        },
        {
          id: "post-test",
          authorId: "me",
          createdAt: "2026-05-14T00:00:00.000Z",
        },
      ),
    ).toThrow("seats must be a number");

    expect(() =>
      normalizeCreatePostInput(
        {
          type: "job",
          title: "농촌 일손 가능",
          body: "농번기 일손을 도울 수 있어요.",
          placeName: "다로리 일대",
          wageAmount: "12000" as never,
        },
        {
          id: "post-job",
          authorId: "me",
          createdAt: "2026-05-14T00:00:00.000Z",
        },
      ),
    ).toThrow("wageAmount must be a number");
  });
});
