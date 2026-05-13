import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { AppModule } from "./app.module";

describe("AppModule", () => {
  it("composes the Nest feature modules", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  });
});
