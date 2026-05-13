import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { BottomTabId } from "@dairuri/shared";
import { BusArchiveScreen } from "../features/bus/BusArchiveScreen";
import { ChatScreen } from "../features/chat/ChatScreen";
import { MapScreen } from "../features/map/MapScreen";
import { PostScreen } from "../features/posts/PostScreen";
import { ProfileScreen } from "../features/profile/ProfileScreen";
import { BottomNavigation } from "../navigation/BottomNavigation";
import { colors } from "../theme/tokens";

export function DairuriApp() {
  const [activeTab, setActiveTab] = useState<BottomTabId>("map");

  const content = useMemo(() => {
    switch (activeTab) {
      case "bus":
        return <BusArchiveScreen />;
      case "post":
        return <PostScreen />;
      case "chat":
        return <ChatScreen />;
      case "profile":
        return <ProfileScreen />;
      case "map":
      default:
        return <MapScreen />;
    }
  }, [activeTab]);

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={["top", "bottom"]} style={styles.shell}>
        <StatusBar style="dark" />
        <View style={styles.appSurface}>{content}</View>
        <View style={styles.navSurface}>
          <BottomNavigation activeTab={activeTab} onSelect={setActiveTab} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  appSurface: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    backgroundColor: colors.background,
  },
  navSurface: {
    width: "100%",
    maxWidth: 430,
  },
});
