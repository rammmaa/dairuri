import {
  formatMannerTemperature,
  getMannerTemperatureLevel,
  getMannerTemperatureProgress,
} from "../data/mannerTemperature";

describe("manner temperature display", () => {
  it("formats temperature with a concise Korean status label", () => {
    expect(formatMannerTemperature(36.5)).toEqual({
      value: "36.5°C",
      label: "시작",
    });
    expect(formatMannerTemperature(40.6)).toEqual({
      value: "40.6°C",
      label: "안정",
    });
  });

  it("clamps progress for the temperature meter", () => {
    expect(getMannerTemperatureProgress(-1)).toBe("0%");
    expect(getMannerTemperatureProgress(40.6)).toBe("41%");
    expect(getMannerTemperatureProgress(101)).toBe("100%");
  });

  it("uses neutral labels instead of placeholder copy", () => {
    expect(getMannerTemperatureLevel(35.9).description).toBe(
      "36.5°C에서 시작해요.",
    );
    expect(getMannerTemperatureLevel(55).description).toBe(
      "매칭 완료와 후기 반영으로 높아져요.",
    );
  });
});
