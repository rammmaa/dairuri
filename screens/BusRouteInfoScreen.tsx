import { ComingSoonScreen } from "../components/ComingSoonScreen";

export type BusRouteInfoScreenProps = {
  onBack?: () => void;
};

/**
 * Phase 2 stub for the per-route map and direction info screen reached by
 * the (i) icon in the bus archive header. The Figma frame only carries a
 * note ("각 노선별 지도가 뜨도록 / 방향, 노선") and no concrete layout, so
 * the real implementation will land in a follow-up iteration. This stub
 * exists so the entry point is discoverable today.
 */
export function BusRouteInfoScreen({ onBack }: BusRouteInfoScreenProps) {
  return (
    <ComingSoonScreen
      title="노선 정보"
      heading="노선별 지도와 방향 정보"
      subheading="곧 보여드릴게요."
      onBack={onBack}
      testID="bus-route-info-stub"
    />
  );
}
