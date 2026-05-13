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

  it("creates a local job post", () => {
    const service = new JobsService();

    const job = service.create({
      title: "평일 오전 농가 포장 도와주실 분",
      placeName: "다로리 농장",
      payLabel: "일급 60,000원",
      scheduleLabel: "월, 수 09:00-12:00",
      description: "포장과 상차 보조가 주 업무입니다.",
    });

    expect(job).toMatchObject({
      type: "job",
      title: "평일 오전 농가 포장 도와주실 분",
      placeName: "다로리 농장",
    });
    expect(service.findAll()).toContainEqual(job);
  });
});
