import {
  authenticateUser,
  registerUser,
} from "../server/api/repository";
import { consumePhoneVerificationProof } from "../server/api/phoneVerification";
import { getPostgresPool } from "../server/db/postgres";
import type { SignupInput } from "../types/domain";

jest.mock("../server/db/postgres", () => ({
  getPostgresPool: jest.fn(),
}));

jest.mock("../server/api/phoneVerification", () => {
  const actual = jest.requireActual("../server/api/phoneVerification");
  return {
    ...actual,
    consumePhoneVerificationProof: jest.fn(),
  };
});

describe("server auth repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("queries a canonical phone identifier when logging in", async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    jest.mocked(getPostgresPool).mockReturnValue({ query } as never);

    await expect(
      authenticateUser({
        identifier: "010-1234-5678",
        password: "password123",
      }),
    ).rejects.toThrow("invalid credentials");

    expect(query).toHaveBeenCalledWith(expect.stringContaining("regexp_replace"), [
      "010-1234-5678",
      "01012345678",
    ]);
  });

  it("rejects a duplicate signup phone before consuming the phone proof", async () => {
    const client = {
      query: jest.fn((sql: string) => {
        if (sql === "begin" || sql === "rollback") {
          return Promise.resolve({ rows: [] });
        }

        if (sql.includes("phone_exists")) {
          return Promise.resolve({
            rows: [
              {
                phone_exists: true,
                email_exists: false,
                login_id_exists: false,
              },
            ],
          });
        }

        return Promise.reject(new Error(`unexpected query: ${sql}`));
      }),
      release: jest.fn(),
    };
    jest.mocked(getPostgresPool).mockReturnValue({
      connect: jest.fn().mockResolvedValue(client),
    } as never);

    await expect(registerUser(validSignupInput())).rejects.toThrow(
      "phone is already registered",
    );

    expect(consumePhoneVerificationProof).not.toHaveBeenCalled();
    expect(client.query).toHaveBeenCalledWith("rollback");
    expect(client.release).toHaveBeenCalled();
  });
});

function validSignupInput(): SignupInput {
  return {
    loginId: "tester123",
    nickname: "테스터",
    realName: "테스터",
    phone: "010-1234-5678",
    email: "tester@example.com",
    password: "password123",
    driverType: "nonDriver",
    phoneVerification: {
      id: "verification-1",
      token: "verified-token",
    },
  };
}
