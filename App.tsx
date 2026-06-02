import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from "@expo-google-fonts/noto-sans";
import { StyleSheet, Text, View } from "react-native";
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from "react-native-safe-area-context";

import { AuthScreen } from "./screens/auth/AuthScreen";
import { MapScreen } from "./screens/MapScreen";
import { RouteScreen } from "./screens/RouteScreen";
import { BusSightingScreen } from "./screens/BusSightingScreen";
import { BusRouteInfoScreen } from "./screens/BusRouteInfoScreen";
import { BusArchiveHistoryScreen } from "./screens/BusArchiveHistoryScreen";
import { BusArrivalTimesScreen } from "./screens/BusArrivalTimesScreen";
import { ChatScreen } from "./screens/ChatScreen";
import { MyPageScreen } from "./screens/MyPageScreen";
import { CreateRecruitmentScreen } from "./screens/CreateRecruitmentScreen";
import { ChatRoomScreen } from "./screens/chat/ChatRoomScreen";
import { ReportScreen } from "./screens/chat/ReportScreen";
import { ApplicationReviewScreen } from "./screens/post/ApplicationReviewScreen";
import { PostDetailScreen } from "./screens/post/PostDetailScreen";
import { MyPostsScreen } from "./screens/profile/MyPostsScreen";
import { ProfileEditScreen } from "./screens/profile/ProfileEditScreen";
import { SavedPostsScreen } from "./screens/profile/SavedPostsScreen";
import { SettingsScreen } from "./screens/profile/SettingsScreen";
import {
  ProfileInfoScreen,
  type ProfileInfoScreenKind,
} from "./screens/profile/ProfileInfoScreen";
import { resolveInitialAuthenticated } from "./data/appAuthGate";
import type { BottomNavItem } from "./data/mapHome";
import {
  clearPersistedAuthSession,
  hasAuthSession,
  restoreAuthSession,
} from "./services/authSession";
import { colors } from "./constants/colors";
import { typography } from "./constants/typography";
import { configureDefaultFontScaling } from "./utils/fontScaling";

configureDefaultFontScaling();

type ProfileSubScreen =
  | "edit"
  | "settings"
  | "saved"
  | "mine"
  | ProfileInfoScreenKind
  | null;
const INITIAL_TAB: BottomNavItem["id"] = "map";
const fallbackInitialWindowMetrics = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

export default function App() {
  return (
    <SafeAreaProvider
      initialMetrics={initialWindowMetrics ?? fallbackInitialWindowMetrics}
    >
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [fontsLoaded] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
  });
  const initialAuthenticated = resolveInitialAuthenticated({
    hasAuthSession: hasAuthSession(),
    skipAuth: process.env.EXPO_PUBLIC_DARORI_SKIP_AUTH,
  });
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [authChecked, setAuthChecked] = useState(initialAuthenticated);
  const [activeTab, setActiveTab] = useState<BottomNavItem["id"]>(INITIAL_TAB);
  const [returnTab, setReturnTab] = useState<BottomNavItem["id"]>("map");
  const [profileSubScreen, setProfileSubScreen] =
    useState<ProfileSubScreen>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [reportRoomId, setReportRoomId] = useState<string | null>(null);
  const [reviewApplicationId, setReviewApplicationId] = useState<string | null>(null);
  const [busSightingOpen, setBusSightingOpen] = useState(false);
  const [busRouteInfoOpen, setBusRouteInfoOpen] = useState(false);
  const [busArchiveHistoryOpen, setBusArchiveHistoryOpen] = useState(false);
  const [busArrivalTimesOpen, setBusArrivalTimesOpen] = useState(false);

  useEffect(() => {
    if (!fontsLoaded || authChecked) {
      return undefined;
    }

    let active = true;

    restoreAuthSession()
      .then((session) => {
        if (!active) {
          return;
        }
        setAuthenticated(Boolean(session));
        setAuthChecked(true);
      })
      .catch(() => {
        if (active) {
          setAuthChecked(true);
        }
      });

    return () => {
      active = false;
    };
  }, [authChecked, fontsLoaded]);

  const handleSelectTab = (item: BottomNavItem) => {
    if (item.id === "posts" && activeTab !== "posts") {
      setReturnTab(activeTab);
    }

    setSelectedPostId(null);
    setSelectedChatRoomId(null);
    setReportRoomId(null);
    setReviewApplicationId(null);
    setBusSightingOpen(false);
    setBusRouteInfoOpen(false);
    setBusArchiveHistoryOpen(false);
    setBusArrivalTimesOpen(false);

    if (item.id !== "profile" || activeTab === "profile") {
      setProfileSubScreen(null);
    }

    setActiveTab(item.id);
  };

  if (!fontsLoaded) {
    return <View style={styles.loadingScreen} />;
  }

  if (!authChecked) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>
          로그인 상태를 확인하고 있어요
        </Text>
      </View>
    );
  }

  if (!authenticated) {
    return (
      <>
        <AuthScreen onComplete={() => setAuthenticated(true)} />
        <StatusBar style="dark" />
      </>
    );
  }

  if (selectedPostId) {
    return (
      <>
        <PostDetailScreen
          postId={selectedPostId}
          onBack={() => setSelectedPostId(null)}
          onOpenChat={() => {
            setSelectedPostId(null);
            setActiveTab("chat");
            setSelectedChatRoomId("room-1");
          }}
          onSubmitted={() => {
            setSelectedPostId(null);
            setActiveTab("map");
          }}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  if (reviewApplicationId) {
    return (
      <>
        <ApplicationReviewScreen
          applicationId={reviewApplicationId}
          onBack={() => setReviewApplicationId(null)}
          onGoHome={() => {
            setReviewApplicationId(null);
            setActiveTab("map");
          }}
          onOpenChat={(roomId) => {
            setReviewApplicationId(null);
            setActiveTab("chat");
            setSelectedChatRoomId(roomId);
          }}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  if (reportRoomId) {
    return (
      <>
        <ReportScreen
          roomId={reportRoomId}
          onBack={() => setReportRoomId(null)}
          onSubmitted={() => setReportRoomId(null)}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  if (selectedChatRoomId) {
    return (
      <>
        <ChatRoomScreen
          roomId={selectedChatRoomId}
          onBack={() => setSelectedChatRoomId(null)}
          onReport={setReportRoomId}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  if (busRouteInfoOpen) {
    return (
      <>
        <BusRouteInfoScreen onBack={() => setBusRouteInfoOpen(false)} />
        <StatusBar style="dark" />
      </>
    );
  }

  if (busArchiveHistoryOpen) {
    return (
      <>
        <BusArchiveHistoryScreen
          onBack={() => setBusArchiveHistoryOpen(false)}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  if (busArrivalTimesOpen) {
    return (
      <>
        <BusArrivalTimesScreen
          onBack={() => setBusArrivalTimesOpen(false)}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  if (busSightingOpen) {
    return (
      <>
        <BusSightingScreen
          onBack={() => setBusSightingOpen(false)}
          onOpenRouteInfo={() => setBusRouteInfoOpen(true)}
          onOpenArrivalTimes={() => setBusArrivalTimesOpen(true)}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  const screen =
    activeTab === "bus" ? (
      <RouteScreen
        onSelectTab={handleSelectTab}
        onOpenBusSighting={() => setBusSightingOpen(true)}
        onOpenArchiveHistory={() => setBusArchiveHistoryOpen(true)}
        onOpenArrivalTimes={() => setBusArrivalTimesOpen(true)}
      />
    ) : activeTab === "posts" ? (
      <CreateRecruitmentScreen
        onCancel={() => setActiveTab(returnTab)}
        onComplete={() => setActiveTab("chat")}
      />
    ) : activeTab === "chat" ? (
      <ChatScreen
        onSelectTab={handleSelectTab}
        onOpenRoom={setSelectedChatRoomId}
      />
    ) : activeTab === "profile" ? (
      profileSubScreen === "mine" ? (
        <MyPostsScreen onBack={() => setProfileSubScreen(null)} />
      ) : profileSubScreen === "saved" ? (
        <SavedPostsScreen onBack={() => setProfileSubScreen(null)} />
      ) : profileSubScreen === "settings" ? (
        <SettingsScreen
          onBack={() => setProfileSubScreen(null)}
          onLogout={() => {
            void clearPersistedAuthSession();
            setProfileSubScreen(null);
            setActiveTab("map");
            setAuthenticated(false);
          }}
        />
      ) : profileSubScreen === "edit" ? (
        <ProfileEditScreen
          onBack={() => setProfileSubScreen(null)}
          onSaved={() => setProfileSubScreen(null)}
        />
      ) : profileSubScreen !== null ? (
        <ProfileInfoScreen
          kind={profileSubScreen}
          onBack={() => setProfileSubScreen(null)}
        />
      ) : (
        <MyPageScreen
          onSelectTab={handleSelectTab}
          onOpenProfileScreen={setProfileSubScreen}
          onOpenApplicationReview={setReviewApplicationId}
        />
      )
    ) : (
      <MapScreen onSelectTab={handleSelectTab} onOpenPost={setSelectedPostId} />
    );

  return (
    <>
      {screen}
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  loadingText: {
    color: colors.black,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
});
