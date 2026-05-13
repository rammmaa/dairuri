import { Pressable, StyleSheet, Text } from "react-native";
import { AppIcon, AppIconName } from "./AppIcon";
import { colors } from "../theme/tokens";

interface FilterPillProps {
  icon?: AppIconName;
  label: string;
  accessibilityLabel?: string;
  onPress?: () => void;
  selected?: boolean;
}

export function FilterPill({
  icon,
  label,
  accessibilityLabel,
  onPress,
  selected = false,
}: FilterPillProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? `${label} 필터`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.filterPill, selected ? styles.filterPillSelected : null]}
    >
      {icon ? <AppIcon name={icon} size={15} color={colors.ink} /> : null}
      <Text style={[styles.filterText, selected ? styles.filterTextSelected : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filterPill: {
    minHeight: 38,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  filterPillSelected: {
    borderColor: colors.active,
    backgroundColor: colors.activeSoft,
  },
  filterText: {
    color: colors.inkStrong,
    fontSize: 14,
    fontWeight: "600",
  },
  filterTextSelected: {
    color: colors.active,
  },
});
