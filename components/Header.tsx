import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import {
  getSafeAreaTopInset,
  useRuntimeSafeAreaInsets,
} from "../constants/safeArea";
import { typography } from "../constants/typography";

export type HeaderProps = {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  backTestID?: string;
  right?: ReactNode;
  border?: boolean;
  testID?: string;
  titleSize?: "standard" | "large";
};

export function Header({
  title,
  showBack = false,
  onBack,
  backTestID,
  right,
  border = true,
  testID,
  titleSize = "standard",
}: HeaderProps) {
  const topInset = getSafeAreaTopInset(useRuntimeSafeAreaInsets());
  const adjustsTitleFontSize = titleSize !== "large";

  return (
    <View
      style={[
        styles.root,
        {
          minHeight: 88 + topInset,
          paddingTop: topInset + 36,
        },
        border && styles.border,
      ]}
      testID={testID}
    >
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
      <Text
        style={[styles.title, titleSize === "large" && styles.largeTitle]}
        testID={testID ? `${testID}-title` : undefined}
        numberOfLines={1}
        adjustsFontSizeToFit={adjustsTitleFontSize}
        minimumFontScale={0.82}
        maxFontSizeMultiplier={1.08}
      >
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 18,
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
    minWidth: 0,
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    textAlign: "left",
  },
  largeTitle: {
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
  },
});
