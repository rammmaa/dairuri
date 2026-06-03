import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "../constants/colors";
import { typography } from "../constants/typography";

export type RouteChipProps = {
  /** Route label, already in the "행복버스 N번" form. */
  label: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Small yellow pill that names a Happy Bus route. Used on the confirmation
 * card and the record-confirm modal to mirror the Figma "행복버스 N번" chip.
 */
export function RouteChip({ label, style, testID }: RouteChipProps) {
  return (
    <View style={[styles.chip, style]} testID={testID}>
      <View style={styles.dot} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.yellow,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.black,
  },
  label: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.bold,
  },
});
