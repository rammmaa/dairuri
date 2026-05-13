import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import App from "./App";

describe("Dairuri mobile app", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, "fetch").mockImplementation((input) => {
      const url = String(input);

      if (url.endsWith("/rides")) {
        return Promise.resolve(
          response([
            {
              id: "ride-api",
              type: "ride",
              title: "API에서 온 다로리 라이드",
              departureName: "다로리 카페",
              destinationName: "청도역",
              dayLabel: "매주 월, 수",
              departureTime: "오전 9:20",
              seatsLeft: 2,
              location: { lat: 35.7001, lng: 128.7342 },
            },
          ]),
        );
      }

      if (url.endsWith("/jobs")) {
        return Promise.resolve(
          response([
            {
              id: "job-api",
              type: "job",
              title: "API에서 온 주말 카페 보조",
              placeName: "다로리 카페",
              payLabel: "시급 12,000원",
              scheduleLabel: "토, 일 11:00-15:00",
            },
          ]),
        );
      }

      if (url.endsWith("/bus-reports/recent")) {
        return Promise.resolve(response([]));
      }

      if (url.endsWith("/bus-reports")) {
        return Promise.resolve(
          response({
            id: "bus-report-api",
            routeNumber: "3",
            placeName: "다로리 카페",
            location: { lat: 35.7001, lng: 128.7342 },
            observedAt: "2026-05-11T07:10:00.000Z",
          }),
        );
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders backend-backed service surfaces and bottom tabs", async () => {
    render(<App />);

    expect(screen.getByText("장소 검색창")).toBeTruthy();
    expect(screen.getByRole("button", { name: "정기 라이드 필터" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "비정기 라이드 필터" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "버스 정보 필터" })).toBeTruthy();
    expect(screen.getByText("라이드 쉐어")).toBeTruthy();
    expect(screen.getByText("지금 핫한 모집글")).toBeTruthy();
    expect(screen.getByText("TOP20")).toBeTruthy();
    expect(await screen.findByText("API에서 온 다로리 라이드")).toBeTruthy();

    for (const label of ["지도 탭", "버스 탭", "모집글 탭", "채팅 탭", "프로필 탭"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }

    fireEvent.press(screen.getByRole("button", { name: "모집글 탭" }));
    expect(await screen.findByText("API에서 온 주말 카페 보조")).toBeTruthy();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:3000/rides");
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:3000/jobs");
    });
  });

  it("posts a bus report through the backend from the bus tab", async () => {
    render(<App />);

    fireEvent.press(screen.getByRole("button", { name: "버스 탭" }));

    expect(screen.getByText("방금 버스 봤어요!")).toBeTruthy();
    expect(screen.getByText("현위치: 다로리 카페")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "버스 제보하기" }));

    expect(await screen.findByText("3번 버스 제보가 저장됐어요")).toBeTruthy();
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

  it("responds to map filter controls", async () => {
    render(<App />);

    expect(await screen.findByText("API에서 온 다로리 라이드")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "날짜 필터" }));
    expect(screen.getByRole("button", { name: "오늘 선택" })).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "오늘 선택" }));
    expect(screen.getByText("오늘 필터 적용됨")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "비정기 라이드 필터" }));
    expect(screen.getByText("비정기 라이드 필터 적용됨")).toBeTruthy();
  });
});

function response(body: unknown): Response {
  return {
    ok: true,
    json: () => Promise.resolve(body),
  } as Response;
}
