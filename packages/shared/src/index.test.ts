import { describe, expect, it } from "vitest";
import {
  bottomTabs,
  createJobPostDefaults,
  createRidePostDefaults,
  serviceFeatures,
  verificationBadgeLabels,
} from "./index";

describe("shared product contract", () => {
  it("keeps the five mobile primary tabs from the IA", () => {
    expect(bottomTabs.map((tab) => tab.label)).toEqual([
      "지도",
      "버스",
      "모집글",
      "채팅",
      "프로필",
    ]);
  });

  it("exposes the three Dairuri core service axes", () => {
    expect(serviceFeatures.map((feature) => feature.title)).toEqual([
      "정기 라이딩",
      "버스 아카이빙",
      "일자리",
    ]);
  });

  it("defines ride and job post defaults for mobile forms", () => {
    expect(createRidePostDefaults()).toMatchObject({
      title: "",
      departureName: "",
      destinationName: "",
      dayLabel: "",
      departureTime: "",
      seatsTotal: 1,
    });

    expect(createJobPostDefaults()).toMatchObject({
      title: "",
      placeName: "",
      payLabel: "",
      scheduleLabel: "",
      description: "",
    });
  });

  it("keeps profile verification badge labels stable", () => {
    expect(verificationBadgeLabels).toEqual({
      phone: "전화번호 인증",
      region: "지역 인증",
      driverLicense: "면허 인증",
      insurance: "보험 입력",
    });
  });
});
