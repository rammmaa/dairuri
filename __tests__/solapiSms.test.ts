import {
  buildSolapiSmsRequest,
  createSolapiAuthHeader,
  createSolapiSignature,
  sendSolapiSms,
} from "../server/sms/solapi";

describe("SOLAPI SMS", () => {
  const config = {
    apiKey: "test-api-key",
    apiSecret: "test-secret",
    from: "010-1234-5678",
  };

  it("creates the SOLAPI HMAC-SHA256 signature from date and salt", () => {
    expect(
      createSolapiSignature({
        apiSecret: config.apiSecret,
        date: "2024-03-09T16:00:00.000Z",
        salt: "test-salt-123",
      }),
    ).toBe("d75a534216d03351ffc68031e92cd4f70e8f19f1bd35374c37828adaa052b7a5");
  });

  it("creates the SOLAPI authorization header", () => {
    expect(
      createSolapiAuthHeader({
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
        date: "2024-03-09T16:00:00.000Z",
        salt: "test-salt-123",
      }),
    ).toBe(
      "HMAC-SHA256 apiKey=test-api-key, date=2024-03-09T16:00:00.000Z, salt=test-salt-123, signature=d75a534216d03351ffc68031e92cd4f70e8f19f1bd35374c37828adaa052b7a5",
    );
  });

  it("builds a SOLAPI request with digit-only phone numbers", () => {
    expect(
      buildSolapiSmsRequest({
        config,
        to: "010-5555-7777",
        text: "[다이루리] 인증번호는 123456입니다.",
        date: "2024-03-09T16:00:00.000Z",
        salt: "test-salt-123",
      }),
    ).toEqual({
      url: "https://api.solapi.com/messages/v4/send-many/detail",
      init: {
        method: "POST",
        headers: {
          Authorization:
            "HMAC-SHA256 apiKey=test-api-key, date=2024-03-09T16:00:00.000Z, salt=test-salt-123, signature=d75a534216d03351ffc68031e92cd4f70e8f19f1bd35374c37828adaa052b7a5",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              to: "01055557777",
              from: "01012345678",
              text: "[다이루리] 인증번호는 123456입니다.",
              type: "SMS",
            },
          ],
        }),
      },
    });
  });

  it("fails when SOLAPI rejects delivery or returns failed messages", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(
        JSON.stringify({
          failedMessageList: [
            {
              to: "01055557777",
              statusCode: "400",
              statusMessage: "unregistered sender",
            },
          ],
        }),
      ),
    });

    await expect(
      sendSolapiSms({
        config,
        to: "010-5555-7777",
        text: "[다이루리] 인증번호는 123456입니다.",
        date: "2024-03-09T16:00:00.000Z",
        salt: "test-salt-123",
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrow("solapi sms delivery failed");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.solapi.com/messages/v4/send-many/detail",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
