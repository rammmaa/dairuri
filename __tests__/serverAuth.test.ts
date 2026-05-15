import {
  AuthenticationError,
  getOptionalRequestUserId,
  requireRequestContext,
} from "../server/api/auth";

describe("server API authentication context", () => {
  it("reads the current user id from the Darori user header", () => {
    expect(
      requireRequestContext({
        "x-darori-user-id": " author-1 ",
      }),
    ).toEqual({
      userId: "author-1",
      rateLimitKey: "user:author-1",
    });
  });

  it("rejects write requests without a current user", () => {
    expect(() => requireRequestContext({})).toThrow(AuthenticationError);
    expect(() => requireRequestContext({})).toThrow("authentication required");
  });

  it("returns optional user ids for read requests without requiring auth", () => {
    expect(getOptionalRequestUserId({})).toBeUndefined();
    expect(getOptionalRequestUserId({ "x-darori-user-id": "me" })).toBe("me");
  });
});
