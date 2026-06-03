import {
  createHash,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import type {
  PhoneVerificationConfirmInput,
  PhoneVerificationConfirmResult,
  PhoneVerificationProof,
  PhoneVerificationStartInput,
  PhoneVerificationStartResult,
} from "../../types/domain";
import { getPostgresPool } from "../db/postgres";
import {
  readSolapiSmsConfig,
  sendSolapiSms,
  SolapiSmsConfigError,
} from "../sms/solapi";

type QueryExecutor = {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<{ rows: Record<string, unknown>[]; rowCount?: number | null }>;
};

type PhoneVerificationRow = {
  phone: string;
  code_hash?: string;
  verified_token_hash?: string | null;
  attempts?: number;
  expires_at: Date | string;
  verified_at?: Date | string | null;
  consumed_at?: Date | string | null;
};

export class PhoneVerificationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhoneVerificationInputError";
  }
}

type RequestPhoneVerificationOptions = {
  code?: string;
  exposeCode?: boolean;
  id?: string;
  now?: Date;
};

type ConfirmPhoneVerificationOptions = {
  now?: Date;
  token?: string;
};

type ConsumePhoneVerificationOptions = {
  now?: Date;
};

const PHONE_VERIFICATION_TTL_MINUTES = 10;
const PHONE_VERIFICATION_MAX_ATTEMPTS = 5;
const PHONE_VERIFICATION_SECRET =
  process.env.PHONE_VERIFICATION_HASH_SECRET ?? "darori-phone-verification";

export async function requestPhoneVerification(
  input: PhoneVerificationStartInput,
  options: RequestPhoneVerificationOptions = {},
): Promise<PhoneVerificationStartResult> {
  const phone = normalizePhoneNumber(input.phone);
  const code = options.code ?? createVerificationCode();
  const id = options.id ?? `phone-verification-${randomUUID()}`;
  const now = options.now ?? new Date();
  const expiresAt = new Date(
    now.getTime() + PHONE_VERIFICATION_TTL_MINUTES * 60 * 1000,
  );

  await getPostgresPool().query(
    `
      insert into phone_verifications (id, phone, code_hash, expires_at)
      values ($1, $2, $3, $4)
    `,
    [id, phone, createPhoneVerificationCodeHash(phone, code), expiresAt.toISOString()],
  );
  await deliverPhoneVerificationCode(phone, code);

  return {
    verificationId: id,
    expiresAt: expiresAt.toISOString(),
    ...(shouldExposeDebugCode(options) ? { debugCode: code } : {}),
  };
}

export async function confirmPhoneVerification(
  input: PhoneVerificationConfirmInput,
  options: ConfirmPhoneVerificationOptions = {},
): Promise<PhoneVerificationConfirmResult> {
  const verificationId = requiredText(input.verificationId, "verificationId");
  const code = normalizeVerificationCode(input.code);
  const now = options.now ?? new Date();
  const row = await readPhoneVerification(verificationId);

  assertVerificationCanBeConfirmed(row, now);

  const expectedHash = createPhoneVerificationCodeHash(row.phone, code);
  if (!hashEquals(expectedHash, requiredText(row.code_hash, "codeHash"))) {
    await getPostgresPool().query(
      "update phone_verifications set attempts = attempts + 1 where id = $1",
      [verificationId],
    );
    throw new PhoneVerificationInputError("invalid phone verification code");
  }

  const token = options.token ?? randomBytes(32).toString("base64url");
  const verifiedAt = now.toISOString();
  await getPostgresPool().query(
    `
      update phone_verifications
      set attempts = attempts + 1,
          verified_token_hash = $2,
          verified_at = $3
      where id = $1
    `,
    [verificationId, createPhoneVerificationTokenHash(token), verifiedAt],
  );

  return {
    verificationId,
    phone: row.phone,
    verifiedToken: token,
    verifiedAt,
  };
}

export async function consumePhoneVerificationProof(
  executor: QueryExecutor,
  phone: string,
  proof: PhoneVerificationProof,
  options: ConsumePhoneVerificationOptions = {},
) {
  const verificationId = requiredText(proof.id, "phoneVerification.id");
  const token = requiredText(proof.token, "phoneVerification.token");
  const normalizedPhone = normalizePhoneNumber(phone);
  const now = options.now ?? new Date();
  const { rows } = await executor.query(
    `
      select phone, verified_token_hash, expires_at, verified_at, consumed_at
      from phone_verifications
      where id = $1
      for update
    `,
    [verificationId],
  );
  const row = rows[0] as PhoneVerificationRow | undefined;

  if (!row) {
    throw new PhoneVerificationInputError("phone verification is required");
  }

  if (row.phone !== normalizedPhone) {
    throw new PhoneVerificationInputError(
      "phone verification does not match signup phone",
    );
  }

  if (!row.verified_at || !row.verified_token_hash) {
    throw new PhoneVerificationInputError("phone verification is not confirmed");
  }

  if (row.consumed_at) {
    throw new PhoneVerificationInputError("phone verification is already used");
  }

  if (isExpired(row.expires_at, now)) {
    throw new PhoneVerificationInputError("phone verification expired");
  }

  if (
    !hashEquals(
      createPhoneVerificationTokenHash(token),
      requiredText(row.verified_token_hash, "verifiedTokenHash"),
    )
  ) {
    throw new PhoneVerificationInputError("phone verification is invalid");
  }

  await executor.query(
    "update phone_verifications set consumed_at = $2 where id = $1",
    [verificationId, now.toISOString()],
  );
}

export function assertPhoneVerificationProof(
  proof: PhoneVerificationProof | undefined,
) {
  if (!proof?.id?.trim() || !proof.token?.trim()) {
    throw new PhoneVerificationInputError("phone verification is required");
  }
}

export function createPhoneVerificationCodeHash(phone: string, code: string) {
  return createHash("sha256")
    .update(`${PHONE_VERIFICATION_SECRET}:code:${phone}:${code}`)
    .digest("hex");
}

export function createPhoneVerificationTokenHash(token: string) {
  return createHash("sha256")
    .update(`${PHONE_VERIFICATION_SECRET}:token:${token}`)
    .digest("hex");
}

function shouldExposeDebugCode(options: RequestPhoneVerificationOptions) {
  return (
    options.exposeCode ??
    (process.env.NODE_ENV !== "production" ||
      isPhoneVerificationDebugCodeEnabled())
  );
}

function isPhoneVerificationDebugCodeEnabled() {
  return process.env.PHONE_VERIFICATION_DEBUG_CODE_ENABLED === "true";
}

function createVerificationCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

async function deliverPhoneVerificationCode(phone: string, code: string) {
  if (isPhoneVerificationDebugCodeEnabled()) {
    return;
  }

  const text = `[다로링크] 인증번호는 ${code}입니다.`;
  let config: ReturnType<typeof readSolapiSmsConfig>;

  try {
    config = readSolapiSmsConfig();
  } catch (error) {
    if (error instanceof SolapiSmsConfigError) {
      throw new PhoneVerificationInputError(
        "phone verification sender is not configured",
      );
    }
    throw error;
  }

  if (!config) {
    if (
      process.env.NODE_ENV === "production" &&
      !isPhoneVerificationDebugCodeEnabled()
    ) {
      throw new PhoneVerificationInputError(
        "phone verification sender is not configured",
      );
    }
    return;
  }

  try {
    await sendSolapiSms({ config, to: phone, text });
  } catch (error) {
    throw new PhoneVerificationInputError("phone verification delivery failed");
  }
}

function normalizePhoneNumber(value: string | undefined) {
  const phone = requiredText(value, "phone").replace(/\D/g, "");
  if (!/^01[016789]\d{7,8}$/.test(phone)) {
    throw new PhoneVerificationInputError("valid phone is required");
  }
  return phone;
}

function normalizeVerificationCode(value: string | undefined) {
  const code = requiredText(value, "code").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(code)) {
    throw new PhoneVerificationInputError("verification code must be 6 digits");
  }
  return code;
}

function requiredText(value: string | null | undefined, fieldName: string) {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new PhoneVerificationInputError(`${fieldName} is required`);
  }
  return trimmed;
}

async function readPhoneVerification(verificationId: string) {
  const { rows } = await getPostgresPool().query(
    `
      select phone, code_hash, attempts, expires_at, verified_at, consumed_at
      from phone_verifications
      where id = $1
      limit 1
    `,
    [verificationId],
  );
  const row = rows[0] as PhoneVerificationRow | undefined;
  if (!row) {
    throw new PhoneVerificationInputError("phone verification not found");
  }
  return row;
}

function assertVerificationCanBeConfirmed(row: PhoneVerificationRow, now: Date) {
  if (row.consumed_at) {
    throw new PhoneVerificationInputError("phone verification is already used");
  }

  if (isExpired(row.expires_at, now)) {
    throw new PhoneVerificationInputError("phone verification expired");
  }

  if ((row.attempts ?? 0) >= PHONE_VERIFICATION_MAX_ATTEMPTS) {
    throw new PhoneVerificationInputError("too many phone verification attempts");
  }
}

function isExpired(expiresAt: Date | string, now: Date) {
  return new Date(expiresAt).getTime() <= now.getTime();
}

function hashEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
