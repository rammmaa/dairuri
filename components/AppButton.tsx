import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

import { colors } from "../constants/colors";
import { typography } from "../constants/typography";

export type AppButtonVariant = "primary" | "yellow" | "danger" | "ghost" | "outline";
export type AppButtonSize = "large" | "medium" | "small";

export type AppButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function AppButton({
  label,
  onPress,
  disabled = false,
  variant = "primary",
  size = "large",
  style,
  testID,
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          variant === "outline" && styles.outlineText,
          variant === "ghost" && styles.ghostText,
          disabled && styles.disabledText,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.86}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  large: {
    minHeight: 52,
    paddingHorizontal: 18,
  },
  medium: {
    minHeight: 43,
    paddingHorizontal: 14,
  },
  small: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  primary: {
    backgroundColor: colors.mint,
  },
  yellow: {
    backgroundColor: colors.yellow,
  },
  danger: {
    backgroundColor: colors.red,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  outline: {
    backgroundColor: colors.surface,
    borderColor: colors.mint,
  },
  disabled: {
    backgroundColor: colors.lineStrong,
    borderColor: colors.lineStrong,
  },
  pressed: {
    opacity: 0.82,
  },
  text: {
    color: colors.surface,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    textAlign: "center",
  },
  outlineText: {
    color: colors.mintDark,
  },
  ghostText: {
    color: colors.grayIcon,
  },
  disabledText: {
    color: colors.gray400,
  },
});
