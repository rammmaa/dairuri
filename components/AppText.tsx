import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from "react-native";

import { colors } from "../constants/colors";
import { typography } from "../constants/typography";

export type AppTextVariant =
  | "caption"
  | "body"
  | "bodyStrong"
  | "label"
  | "sectionTitle"
  | "pageTitle";

export type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function AppText({
  variant = "body",
  color,
  style,
  ...props
}: AppTextProps) {
  return (
    <Text
      {...props}
      style={[styles.base, styles[variant], color ? { color } : null, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.black,
    fontFamily: typography.family.regular,
  },
  caption: {
    color: colors.mutedText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  body: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  bodyStrong: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  label: {
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  sectionTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  pageTitle: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
  },
});
