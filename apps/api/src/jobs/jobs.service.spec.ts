import { describe, expect, it } from "vitest";
import { JobsService } from "./jobs.service";

describe("JobsService", () => {
  it("returns local job listings for the recruitment feed", () => {
    const service = new JobsService();

    expect(service.findAll()[0]).toMatchObject({
      type: "job",
      title: "주말 카페 보조 구해요",
      placeName: "다로리 카페",
    });
  });
});
