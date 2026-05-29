import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

export type BottomSheetProps = {
  visible: boolean;
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  testID?: string;
};

export function BottomSheet({
  visible,
  title,
  children,
  onClose,
  testID,
}: BottomSheetProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay} testID={testID}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="바텀시트 닫기"
        style={StyleSheet.absoluteFill}
        onPress={onClose}
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 25,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: 26,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: colors.surface,
    gap: 14,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.stone,
  },
  title: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    textAlign: "center",
  },
});
