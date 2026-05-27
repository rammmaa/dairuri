import { getPostgresPool } from "../server/db/postgres";
import {
  confirmPhoneVerification,
  createPhoneVerificationCodeHash,
  createPhoneVerificationTokenHash,
  requestPhoneVerification,
} from "../server/api/phoneVerification";

jest.mock("../server/db/postgres", () => ({
  getPostgresPool: jest.fn(),
}));

describe("server phone verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a short-lived verification record without storing the raw code", async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    jest.mocked(getPostgresPool).mockReturnValue({ query } as never);

    await expect(
      requestPhoneVerification(
        { phone: " 010-1234-5678 " },
        {
          code: "654321",
          exposeCode: true,
          id: "phone-verification-1",
          now: new Date("2026-05-27T00:00:00.000Z"),
        },
      ),
    ).resolves.toEqual({
      verificationId: "phone-verification-1",
      expiresAt: "2026-05-27T00:10:00.000Z",
      debugCode: "654321",
    });

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("insert into phone_verifications"),
      [
        "phone-verification-1",
        "010-1234-5678",
        createPhoneVerificationCodeHash("010-1234-5678", "654321"),
        "2026-05-27T00:10:00.000Z",
      ],
    );
    expect(query.mock.calls[0]?.[1]).not.toContain("654321");
  });

  it("confirms a valid code and returns a signup proof token", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            phone: "010-1234-5678",
            code_hash: createPhoneVerificationCodeHash(
              "010-1234-5678",
              "123456",
            ),
            attempts: 0,
            expires_at: new Date("2026-05-27T00:10:00.000Z"),
            verified_at: null,
            consumed_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] });
    jest.mocked(getPostgresPool).mockReturnValue({ query } as never);

    await expect(
      confirmPhoneVerification(
        { verificationId: "phone-verification-1", code: "123456" },
        {
          now: new Date("2026-05-27T00:05:00.000Z"),
          token: "verified-phone-token",
        },
      ),
    ).resolves.toEqual({
      verificationId: "phone-verification-1",
      phone: "010-1234-5678",
      verifiedAt: "2026-05-27T00:05:00.000Z",
      verifiedToken: "verified-phone-token",
    });

    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("verified_token_hash"),
      [
        "phone-verification-1",
        createPhoneVerificationTokenHash("verified-phone-token"),
        "2026-05-27T00:05:00.000Z",
      ],
    );
  });
});
