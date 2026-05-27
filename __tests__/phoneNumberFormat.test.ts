import { formatKoreanPhoneNumberInput } from "../data/phoneNumberFormat";

describe("phone number formatting", () => {
  it("formats 11 digit mobile numbers with hyphens", () => {
    expect(formatKoreanPhoneNumberInput("01012345678")).toBe("010-1234-5678");
  });

  it("formats 10 digit mobile numbers with the short middle group", () => {
    expect(formatKoreanPhoneNumberInput("0101234567")).toBe("010-123-4567");
  });

  it("ignores existing separators and caps input to 11 digits", () => {
    expect(formatKoreanPhoneNumberInput("010-1234-567899")).toBe(
      "010-1234-5678",
    );
  });
});
