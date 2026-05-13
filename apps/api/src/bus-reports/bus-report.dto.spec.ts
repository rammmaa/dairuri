import { validate } from "class-validator";
import { describe, expect, it } from "vitest";
import { CreateBusReportDto } from "./bus-report.dto";

describe("CreateBusReportDto", () => {
  it("rejects malformed route numbers and coordinates", async () => {
    const dto = Object.assign(new CreateBusReportDto(), {
      routeNumber: "airport",
      placeName: "",
      lat: 100,
      lng: 200,
    });

    const invalidProperties = (await validate(dto)).map((error) => error.property);

    expect(invalidProperties).toEqual(
      expect.arrayContaining(["routeNumber", "placeName", "lat", "lng"]),
    );
  });
});
