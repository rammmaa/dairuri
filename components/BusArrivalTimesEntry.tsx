import { ChevronRight, History } from "lucide-react-native";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "../constants/colors";
import { typography } from "../constants/typography";

export type BusArrivalTimesEntryProps = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Prominent black entry card that opens the "버스 도착 시간 기록" screen. Sits
 * at the top of the recorder body in the 2026-05-26 Figma frame. Reused as a
 * standalone card so other archive landings can drop it in unchanged.
 */
export function BusArrivalTimesEntry({
  onPress,
  style,
  testID,
}: BusArrivalTimesEntryProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="버스 도착 시간 기록 보기"
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      <History size={18} color={colors.surface} strokeWidth={2.2} />
      <Text style={styles.label}>버스 도착 시간 기록 보기</Text>
      <ChevronRight size={18} color={colors.surface} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    minHeight: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    backgroundColor: colors.black,
  },
  pressed: {
    opacity: 0.86,
  },
  label: {
    flex: 1,
    color: colors.surface,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
  },
});
