import {
  AuthenticationError,
  getOptionalRequestUserId,
  requireRequestContext,
} from "../server/api/auth";

describe("server API authentication context", () => {
  it("reads the current user id from the Darori user header in tests", async () => {
    await expect(
      requireRequestContext({
        "x-darori-user-id": " author-1 ",
      }),
    ).resolves.toEqual({
      userId: "author-1",
      rateLimitKey: "user:author-1",
    });
  });

  it("rejects write requests without a current user", async () => {
    await expect(requireRequestContext({})).rejects.toThrow(AuthenticationError);
    await expect(requireRequestContext({})).rejects.toThrow("authentication required");
  });

  it("returns optional user ids for read requests without requiring auth", async () => {
    await expect(getOptionalRequestUserId({})).resolves.toBeUndefined();
    await expect(
      getOptionalRequestUserId({ "x-darori-user-id": "me" }),
    ).resolves.toBe("me");
  });
});
