import { StyleSheet, View } from "react-native";

import { colors } from "../constants/colors";

export type StepProgressBarProps = {
  current: number;
  total: number;
  color?: string;
};

export function StepProgressBar({
  current,
  total,
  color = colors.mint,
}: StepProgressBarProps) {
  const width = `${Math.max(0, Math.min(1, current / total)) * 100}%` as const;

  return (
    <View style={styles.track}>
      <View style={[styles.active, { width, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    backgroundColor: colors.line,
  },
  active: {
    height: "100%",
  },
});
