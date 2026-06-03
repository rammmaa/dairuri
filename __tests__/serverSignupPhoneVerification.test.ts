import { registerUser } from "../server/api/repository";
import { getPostgresPool } from "../server/db/postgres";
import type { SignupInput } from "../types/domain";

jest.mock("../server/db/postgres", () => ({
  getPostgresPool: jest.fn(() => {
    throw new Error("signup should not touch the database before verification");
  }),
}));

describe("server signup phone verification gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects signup before a verified phone proof is attached", async () => {
    await expect(
      registerUser({
        loginId: "tester123",
        nickname: "테스터",
        realName: "테스터",
        phone: "010-1234-5678",
        email: "tester@example.com",
        password: "password123",
        driverType: "nonDriver",
      } as SignupInput),
    ).rejects.toThrow("phone verification is required");

    expect(getPostgresPool).not.toHaveBeenCalled();
  });
});
