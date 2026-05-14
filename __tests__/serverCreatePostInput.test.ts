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
      wageAmount: null,
      createdAt: "2026-05-14T00:00:00.000Z",
    });
  });

  it("rejects post payloads without type-specific required fields", () => {
    expect(() =>
      normalizeCreatePostInput(
        {
          type: "job",
          title: "알바 구해요",
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
});
