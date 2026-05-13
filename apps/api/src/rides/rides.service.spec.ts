import { describe, expect, it } from "vitest";
import { RidesService } from "./rides.service";

describe("RidesService", () => {
  it("returns recurring ride listings for the map and recruitment feed", () => {
    const service = new RidesService();

    const rides = service.findAll();

    expect(rides[0]).toMatchObject({
      type: "ride",
      title: "다로리 카페 매주 같이 가실 분 구해요",
      departureName: "다로리 카페",
    });
  });

  it("creates a ride post with all seats initially available", () => {
    const service = new RidesService();

    const ride = service.create({
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

    expect(ride).toMatchObject({
      type: "ride",
      title: "병원 정기 라이드 함께 가실 분",
      seatsLeft: 3,
      location: { lat: 35.7001, lng: 128.7342 },
    });
    expect(service.findOne(ride.id)).toEqual(ride);
  });
});
