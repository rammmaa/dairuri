import { describe, expect, it } from "vitest";
import { UsersService } from "./users.service";

describe("UsersService", () => {
  it("returns the current user's profile summary", () => {
    const service = new UsersService();

    expect(service.findMe()).toMatchObject({
      nickname: "다로리인",
      verifications: ["phone", "region"],
    });
  });
});
