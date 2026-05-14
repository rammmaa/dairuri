import { ChevronLeft } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
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
      <View style={styles.side}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로가기"
            hitSlop={12}
            onPress={onBack}
            testID={backTestID}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <ChevronLeft size={22} color={colors.black} strokeWidth={2.4} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 52,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  side: {
    width: 72,
    minHeight: 44,
    justifyContent: "center",
  },
  right: {
    alignItems: "flex-end",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.74,
  },
  title: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
    textAlign: "center",
  },
});
