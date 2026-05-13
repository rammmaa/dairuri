import {
  createBusReport,
  createJobPost,
  createRidePost,
  fetchChatRooms,
  fetchJobs,
  fetchMyProfile,
  fetchRecentBusReports,
  fetchRides,
} from "./dairuriApi";

describe("dairuriApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads ride and job listings from the backend", async () => {
    jest.spyOn(global, "fetch").mockImplementation((input) => {
      const url = String(input);

      if (url.endsWith("/rides")) {
        return Promise.resolve(response([{ id: "ride-1", type: "ride" }]));
      }

      if (url.endsWith("/jobs")) {
        return Promise.resolve(response([{ id: "job-1", type: "job" }]));
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await expect(fetchRides()).resolves.toEqual([{ id: "ride-1", type: "ride" }]);
    await expect(fetchJobs()).resolves.toEqual([{ id: "job-1", type: "job" }]);

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:3000/rides");
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:3000/jobs");
  });

  it("loads recent bus reports and posts new bus sightings", async () => {
    jest.spyOn(global, "fetch").mockImplementation((input, init) => {
      const url = String(input);

      if (url.endsWith("/bus-reports/recent")) {
        return Promise.resolve(response([{ id: "bus-report-1" }]));
      }

      if (url.endsWith("/bus-reports")) {
        return Promise.resolve(response({ id: "bus-report-created" }));
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await expect(fetchRecentBusReports()).resolves.toEqual([{ id: "bus-report-1" }]);
    await expect(
      createBusReport({
        routeNumber: "3",
        placeName: "다로리 카페",
        lat: 35.7001,
        lng: 128.7342,
      }),
    ).resolves.toEqual({ id: "bus-report-created" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/bus-reports",
      {
        body: JSON.stringify({
          routeNumber: "3",
          placeName: "다로리 카페",
          lat: 35.7001,
          lng: 128.7342,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    );
  });

  it("posts new ride and job listings", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(response({ id: "created" }));

    await createRidePost({
      title: "병원 정기 라이드 함께 가실 분",
      departureName: "다로리 카페",
      destinationName: "청도 병원",
      dayLabel: "매주 화",
      departureTime: "오전 8:30",
      seatsTotal: 3,
      description: "병원 방문 동선이 맞는 분을 모집합니다.",
      lat: 35.7001,
      lng: 128.7342,
    });

    await createJobPost({
      title: "평일 오전 농가 포장 도와주실 분",
      placeName: "다로리 농장",
      payLabel: "일급 60,000원",
      scheduleLabel: "월, 수 09:00-12:00",
      description: "포장과 상차 보조가 주 업무입니다.",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/rides",
      expect.objectContaining({ method: "POST" }),
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3000/jobs",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("loads profile and chat summaries", async () => {
    jest.spyOn(global, "fetch").mockImplementation((input) => {
      const url = String(input);

      if (url.endsWith("/users/me")) {
        return Promise.resolve(response({ id: "user-me", nickname: "다로리인" }));
      }

      if (url.endsWith("/chat/rooms")) {
        return Promise.resolve(response([{ id: "room-1" }]));
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    await expect(fetchMyProfile()).resolves.toMatchObject({ nickname: "다로리인" });
    await expect(fetchChatRooms()).resolves.toEqual([{ id: "room-1" }]);
  });
});

function response(body: unknown): Response {
  return {
    ok: true,
    json: () => Promise.resolve(body),
  } as Response;
}
