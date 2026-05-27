import { getPostgresPool } from "../server/db/postgres";
import {
  confirmPhoneVerification,
  createPhoneVerificationCodeHash,
  createPhoneVerificationTokenHash,
  requestPhoneVerification,
} from "../server/api/phoneVerification";
import { sendSolapiSms } from "../server/sms/solapi";

jest.mock("../server/db/postgres", () => ({
  getPostgresPool: jest.fn(),
}));
jest.mock("../server/sms/solapi", () => {
  const actual = jest.requireActual("../server/sms/solapi");
  return {
    ...actual,
    sendSolapiSms: jest.fn(),
  };
});

describe("server phone verification", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDebugCodeEnabled =
    process.env.PHONE_VERIFICATION_DEBUG_CODE_ENABLED;
  const originalSolapiEnv = {
    apiKey: process.env.SOLAPI_API_KEY,
    apiSecret: process.env.SOLAPI_API_SECRET,
    from: process.env.SOLAPI_FROM,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(sendSolapiSms).mockResolvedValue(undefined);
    process.env.NODE_ENV = originalNodeEnv;
    if (originalDebugCodeEnabled === undefined) {
      delete process.env.PHONE_VERIFICATION_DEBUG_CODE_ENABLED;
    } else {
      process.env.PHONE_VERIFICATION_DEBUG_CODE_ENABLED =
        originalDebugCodeEnabled;
    }
    restoreEnv("SOLAPI_API_KEY", originalSolapiEnv.apiKey);
    restoreEnv("SOLAPI_API_SECRET", originalSolapiEnv.apiSecret);
    restoreEnv("SOLAPI_FROM", originalSolapiEnv.from);
  });

  it("creates a short-lived verification record without storing the raw code", async () => {
    setSolapiEnv();
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
    expect(sendSolapiSms).toHaveBeenCalledWith(
      expect.objectContaining({
        config: {
          apiKey: "test-solapi-key",
          apiSecret: "test-solapi-secret",
          from: "010-1234-5678",
        },
        to: "010-1234-5678",
        text: "[다이루리] 인증번호는 654321입니다.",
      }),
    );
  });

  it("maps SOLAPI delivery failures to a phone verification error", async () => {
    setSolapiEnv();
    const query = jest.fn().mockResolvedValue({ rows: [] });
    jest.mocked(getPostgresPool).mockReturnValue({ query } as never);
    jest
      .mocked(sendSolapiSms)
      .mockRejectedValue(new Error("solapi sms delivery failed: 401"));

    await expect(
      requestPhoneVerification(
        { phone: "010-1234-5678" },
        {
          code: "654321",
          id: "phone-verification-delivery-failure",
          now: new Date("2026-05-27T00:00:00.000Z"),
        },
      ),
    ).rejects.toThrow("phone verification delivery failed");
  });

  it("can expose a production verification code only when explicitly enabled", async () => {
    process.env.NODE_ENV = "production";
    process.env.PHONE_VERIFICATION_DEBUG_CODE_ENABLED = "true";
    const query = jest.fn().mockResolvedValue({ rows: [] });
    jest.mocked(getPostgresPool).mockReturnValue({ query } as never);

    await expect(
      requestPhoneVerification(
        { phone: "010-5555-7777" },
        {
          code: "135790",
          id: "phone-verification-production-debug",
          now: new Date("2026-05-27T00:00:00.000Z"),
        },
      ),
    ).resolves.toEqual({
      verificationId: "phone-verification-production-debug",
      expiresAt: "2026-05-27T00:10:00.000Z",
      debugCode: "135790",
    });
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

function setSolapiEnv() {
  process.env.SOLAPI_API_KEY = "test-solapi-key";
  process.env.SOLAPI_API_SECRET = "test-solapi-secret";
  process.env.SOLAPI_FROM = "010-1234-5678";
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
