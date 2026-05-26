import { ComingSoonScreen } from "../components/ComingSoonScreen";

export type BusArrivalTimesScreenProps = {
  onBack?: () => void;
};

/**
 * Phase 2 stub for the "버스 도착 시간 기록 보기" entry point that the Figma
 * frame shows on the bus archive landing. The target screen is not yet
 * designed; this stub keeps the entry point usable so the user can confirm
 * the surface exists.
 */
export function BusArrivalTimesScreen({
  onBack,
}: BusArrivalTimesScreenProps) {
  return (
    <ComingSoonScreen
      title="버스 도착 시간 기록"
      heading="버스 도착 시간 기록 화면"
      subheading="곧 추가됩니다."
      onBack={onBack}
      testID="bus-arrival-times-stub"
    />
  );
}
