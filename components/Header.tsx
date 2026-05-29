import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { screenTopInset } from "../constants/safeArea";
import { typography } from "../constants/typography";

export type HeaderProps = {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  backTestID?: string;
  right?: ReactNode;
  border?: boolean;
};

export function Header({
  title,
  showBack = false,
  onBack,
  backTestID,
  right,
  border = true,
}: HeaderProps) {
  return (
    <View style={[styles.root, border && styles.border]}>
      {showBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로가기"
          hitSlop={12}
          onPress={onBack}
          testID={backTestID}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ChevronLeft size={24} color={colors.black} strokeWidth={2.35} />
        </Pressable>
      ) : (
        <View style={styles.backSpacer} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 88 + screenTopInset,
    paddingHorizontal: 18,
    paddingTop: screenTopInset + 36,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lineStrong,
  },
  right: {
    minWidth: 72,
    minHeight: 36,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  backSpacer: {
    width: 34,
    height: 36,
  },
  backButton: {
    width: 34,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.74,
  },
  title: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    textAlign: "left",
  },
});
