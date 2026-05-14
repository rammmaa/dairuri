import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { typography } from "../constants/typography";

export type CheckBoxRowProps = {
  label: string;
  checked: boolean;
  onPress: () => void;
  testID?: string;
};

export function CheckBoxRow({ label, checked, onPress, testID }: CheckBoxRowProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <View style={[styles.box, checked && styles.checkedBox]}>
        {checked ? <Check size={14} color={colors.surface} strokeWidth={3} /> : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pressed: {
    opacity: 0.76,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkedBox: {
    borderColor: colors.mint,
    backgroundColor: colors.mint,
  },
  label: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
  },
});
