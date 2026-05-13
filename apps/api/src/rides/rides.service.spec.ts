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
});
