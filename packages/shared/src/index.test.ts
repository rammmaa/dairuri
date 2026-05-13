import { describe, expect, it } from "vitest";
import { bottomTabs, serviceFeatures } from "./index";

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
});
