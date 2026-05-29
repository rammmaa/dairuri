import { ChevronDown, X } from "lucide-react-native";
import type { ComponentType } from "react";
import type { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

type FilterChipIcon = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

export type FilterChipProps = {
  label: string;
  icon?: FilterChipIcon;
  showChevron?: boolean;
  showClose?: boolean;
  compact?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  iconTestID?: string;
};

export function FilterChip({
  label,
  icon,
  showChevron = false,
  showClose = false,
  compact = false,
  selected = false,
  disabled = false,
  onPress,
  style,
  testID,
  iconTestID,
}: FilterChipProps) {
  const LeadingIcon = icon;
  const iconColor = selected ? colors.mintDark : colors.grayIcon;
  const textColor = selected ? colors.mintDark : colors.black;

  const content: ReactNode = (
    <>
      {LeadingIcon ? (
        <View style={styles.iconSlot} testID={iconTestID}>
          <LeadingIcon size={15} color={iconColor} strokeWidth={2.25} />
        </View>
      ) : null}
      <Text
        style={[
          styles.label,
          compact && styles.compactLabel,
          { color: disabled ? colors.grayText : textColor },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.88}
      >
        {label}
      </Text>
      {showClose ? (
        <X
          size={14}
          color={disabled ? colors.grayText : iconColor}
          strokeWidth={2.25}
        />
      ) : showChevron ? (
        <ChevronDown
          size={14}
          color={disabled ? colors.grayText : iconColor}
          strokeWidth={2.25}
        />
      ) : null}
    </>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.container,
        compact && styles.compact,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: spacing.chipHeight,
    maxWidth: "100%",
    paddingHorizontal: 13,
    borderRadius: spacing.chipHeight / 2,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  compact: {
    minHeight: 30,
    paddingHorizontal: 10,
  },
  selected: {
    borderColor: colors.mint,
    backgroundColor: colors.mintLight,
  },
  disabled: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.82,
  },
  iconSlot: {
    width: 15,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flexShrink: 1,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: "center",
  },
  compactLabel: {
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
});
