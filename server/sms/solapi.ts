import { createHmac, randomBytes } from "node:crypto";

export type SolapiSmsConfig = {
  apiKey: string;
  apiSecret: string;
  from: string;
};

type SolapiSignatureInput = {
  apiSecret: string;
  date: string;
  salt: string;
};

type SolapiAuthHeaderInput = SolapiSignatureInput & {
  apiKey: string;
};

type BuildSolapiSmsRequestInput = {
  config: SolapiSmsConfig;
  to: string;
  text: string;
  date?: string;
  salt?: string;
};

type SolapiFetchInit = {
  method: "POST";
  headers: Record<string, string>;
  body: string;
};

type SolapiFetchResponse = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

type SolapiFetch = (
  url: string,
  init: SolapiFetchInit,
) => Promise<SolapiFetchResponse>;

type SendSolapiSmsInput = Omit<BuildSolapiSmsRequestInput, "config"> & {
  config?: SolapiSmsConfig;
  fetchImpl?: SolapiFetch;
};

type SolapiSendResponse = {
  failedMessageList?: unknown[];
};

export class SolapiSmsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SolapiSmsConfigError";
  }
}

export class SolapiSmsDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SolapiSmsDeliveryError";
  }
}

const SOLAPI_SEND_ENDPOINT =
  "https://api.solapi.com/messages/v4/send-many/detail";

export function readSolapiSmsConfig(
  env: NodeJS.ProcessEnv = process.env,
): SolapiSmsConfig | undefined {
  const apiKey = trimEnv(env.SOLAPI_API_KEY);
  const apiSecret = trimEnv(env.SOLAPI_API_SECRET);
  const from = trimEnv(env.SOLAPI_FROM);
  const values = [apiKey, apiSecret, from];

  if (values.every((value) => !value)) {
    return undefined;
  }

  if (!apiKey || !apiSecret || !from) {
    throw new SolapiSmsConfigError("solapi sms sender is not configured");
  }

  return { apiKey, apiSecret, from };
}

export function createSolapiSignature(input: SolapiSignatureInput) {
  return createHmac("sha256", input.apiSecret)
    .update(input.date + input.salt)
    .digest("hex");
}

export function createSolapiAuthHeader(input: SolapiAuthHeaderInput) {
  return [
    "HMAC-SHA256",
    `apiKey=${input.apiKey},`,
    `date=${input.date},`,
    `salt=${input.salt},`,
    `signature=${createSolapiSignature(input)}`,
  ].join(" ");
}

export function buildSolapiSmsRequest(input: BuildSolapiSmsRequestInput) {
  const method: "POST" = "POST";
  const text = input.text.trim();
  const date = input.date ?? new Date().toISOString();
  const salt = input.salt ?? randomBytes(16).toString("hex");

  if (!text) {
    throw new SolapiSmsConfigError("solapi sms text is required");
  }

  return {
    url: SOLAPI_SEND_ENDPOINT,
    init: {
      method,
      headers: {
        Authorization: createSolapiAuthHeader({
          apiKey: input.config.apiKey,
          apiSecret: input.config.apiSecret,
          date,
          salt,
        }),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            to: toDigitsOnly(input.to, "to"),
            from: toDigitsOnly(input.config.from, "from"),
            text,
            type: "SMS",
          },
        ],
      }),
    },
  };
}

export async function sendSolapiSms(input: SendSolapiSmsInput) {
  const config = input.config ?? readSolapiSmsConfig();

  if (!config) {
    throw new SolapiSmsConfigError("solapi sms sender is not configured");
  }

  const request = buildSolapiSmsRequest({ ...input, config });
  const fetchImpl = input.fetchImpl ?? (fetch as SolapiFetch);
  const response = await fetchImpl(request.url, request.init);
  const body = await response.text().catch(() => "");

  if (!response.ok) {
    throw new SolapiSmsDeliveryError(
      `solapi sms delivery failed: ${response.status}${body ? ` ${body}` : ""}`,
    );
  }

  if (hasFailedMessages(body)) {
    throw new SolapiSmsDeliveryError("solapi sms delivery failed");
  }
}

function hasFailedMessages(body: string) {
  if (!body.trim()) {
    return false;
  }

  try {
    const parsed = JSON.parse(body) as SolapiSendResponse;
    return Boolean(parsed.failedMessageList?.length);
  } catch {
    return false;
  }
}

function trimEnv(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toDigitsOnly(value: string, fieldName: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    throw new SolapiSmsConfigError(
      `solapi sms ${fieldName} phone number is required`,
    );
  }

  return digits;
}
