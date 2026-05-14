import {
  Bus,
  Map as MapIcon,
  MessageCircle,
  Plus,
  UserRound,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { BottomNavItem } from "../data/mapHome";

export type BottomNavProps = {
  items: readonly BottomNavItem[];
  selectedId?: BottomNavItem["id"];
  onSelect?: (item: BottomNavItem) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const navIcons: Record<BottomNavItem["id"], LucideIcon> = {
  map: MapIcon,
  bus: Bus,
  posts: Plus,
  chat: MessageCircle,
  profile: UserRound,
};

export function BottomNav({
  items,
  selectedId = "map",
  onSelect,
  style,
  testID,
}: BottomNavProps) {
  return (
    <View
      accessibilityRole="tablist"
      testID={testID}
      style={[styles.container, style]}
    >
      {items.map((item) => {
        const Icon = navIcons[item.id];
        const selected = item.id === selectedId;
        const isPostAction = item.id === "posts";
        const activeColor = selected ? colors.mintDark : colors.grayText;

        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            onPress={onSelect ? () => onSelect(item) : undefined}
            testID={testID ? `${testID}-${item.id}` : undefined}
            style={({ pressed }) => [
              styles.item,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.iconFrame,
                isPostAction && styles.postIconFrame,
                selected && !isPostAction && styles.selectedIconFrame,
              ]}
            >
              <Icon
                size={isPostAction ? 22 : 23}
                color={isPostAction ? colors.surface : activeColor}
                strokeWidth={isPostAction ? 2.6 : selected ? 2.5 : 2.15}
              />
            </View>
            <Text
              style={[
                styles.label,
                isPostAction && styles.postLabel,
                selected && styles.selectedLabel,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: spacing.navHeight,
    paddingHorizontal: 8,
    paddingTop: 7,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "stretch",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 8,
  },
  item: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  pressed: {
    opacity: 0.78,
  },
  iconFrame: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedIconFrame: {
    backgroundColor: colors.mintLight,
  },
  postIconFrame: {
    backgroundColor: colors.mintDark,
  },
  label: {
    width: "100%",
    color: colors.grayText,
    fontFamily: typography.family.nav,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
    textAlign: "center",
  },
  selectedLabel: {
    color: colors.mintDark,
    fontWeight: typography.weight.bold,
  },
  postLabel: {
    color: colors.black,
  },
});
