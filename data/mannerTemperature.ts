export type MannerTemperatureLevel = {
  label: "시작" | "안정" | "좋음" | "우수";
  description: string;
};

export function getMannerTemperatureLevel(
  temperature: number,
): MannerTemperatureLevel {
  if (temperature < 38) {
    return {
      label: "시작",
      description: "36.5°C에서 시작해요.",
    };
  }

  if (temperature < 45) {
    return {
      label: "안정",
      description: "약속과 소통이 안정적으로 쌓이고 있어요.",
    };
  }

  if (temperature < 60) {
    return {
      label: "좋음",
      description: "매칭 완료와 후기 반영으로 높아져요.",
    };
  }

  return {
    label: "우수",
    description: "신뢰할 수 있는 이용 기록이 충분히 쌓였어요.",
  };
}

export function getMannerTemperatureProgress(temperature: number) {
  const clamped = Math.min(100, Math.max(0, temperature));
  return `${Math.round(clamped)}%` as `${number}%`;
}

export function formatMannerTemperature(temperature: number) {
  const level = getMannerTemperatureLevel(temperature);

  return {
    value: `${temperature.toFixed(1)}°C`,
    label: level.label,
  };
}
