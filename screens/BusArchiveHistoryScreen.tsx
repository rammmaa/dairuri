import { ComingSoonScreen } from "../components/ComingSoonScreen";

export type BusArchiveHistoryScreenProps = {
  onBack?: () => void;
};

/**
 * Phase 2 stub for the per-route archive history view. The Figma flow stops
 * at the route grid; tapping a route in archive mode currently has no
 * destination. This stub keeps the entry point real until the history
 * screen is designed.
 */
export function BusArchiveHistoryScreen({
  onBack,
}: BusArchiveHistoryScreenProps) {
  return (
    <ComingSoonScreen
      title="아카이빙 보기"
      heading="호선별 기록 히스토리"
      subheading="곧 추가됩니다."
      onBack={onBack}
      testID="bus-archive-history-stub"
    />
  );
}
