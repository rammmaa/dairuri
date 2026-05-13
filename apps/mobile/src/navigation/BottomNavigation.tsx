import { Pressable, StyleSheet, Text, View } from "react-native";
import { BottomTabId, bottomTabs } from "@dairuri/shared";
import { AppIcon, AppIconName } from "../components/AppIcon";
import { colors } from "../theme/tokens";

const tabIcons: Record<BottomTabId, AppIconName> = {
  map: "map",
  bus: "truck",
  post: "plus-square",
  chat: "message-circle",
  profile: "user",
};

interface BottomNavigationProps {
  activeTab: BottomTabId;
  onSelect: (tab: BottomTabId) => void;
}

export function BottomNavigation({ activeTab, onSelect }: BottomNavigationProps) {
  return (
    <View style={styles.tabBar}>
      {bottomTabs.map((tab) => {
        const isActive = tab.id === activeTab;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityLabel={`${tab.label} 탭`}
            accessibilityState={{ selected: isActive }}
            onPress={() => onSelect(tab.id)}
            style={styles.tabButton}
          >
            <AppIcon
              name={tabIcons[tab.id]}
              size={25}
              color={isActive ? colors.active : colors.tabIcon}
            />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 74,
    borderTopWidth: 1,
    borderTopColor: colors.tabBorder,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 6,
  },
  tabButton: {
    width: 64,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  tabLabel: {
    color: colors.tabText,
    fontSize: 12,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: colors.tabTextActive,
  },
});
