import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { useState } from "react";
import {
  NotoSans_400Regular,
  NotoSans_500Medium,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from "@expo-google-fonts/noto-sans";
import { View } from "react-native";

import { AuthScreen } from "./screens/auth/AuthScreen";
import { MapScreen } from "./screens/MapScreen";
import { RouteScreen } from "./screens/RouteScreen";
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
import type { BottomNavItem } from "./data/mapHome";

type DevStartScreen = "auth" | BottomNavItem["id"];
type ProfileSubScreen = "edit" | "settings" | "saved" | "mine" | null;

const DEV_START_SCREEN: DevStartScreen =
  process.env.NODE_ENV === "test" ? "auth" : "map";

export default function App() {
  const [fontsLoaded] = useFonts({
    NotoSans_400Regular,
    NotoSans_500Medium,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
  });
  const [authenticated, setAuthenticated] = useState(DEV_START_SCREEN !== "auth");
  const [activeTab, setActiveTab] = useState<BottomNavItem["id"]>(
    DEV_START_SCREEN === "auth" ? "map" : DEV_START_SCREEN,
  );
  const [returnTab, setReturnTab] = useState<BottomNavItem["id"]>("map");
  const [profileSubScreen, setProfileSubScreen] =
    useState<ProfileSubScreen>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<string | null>(null);
  const [reportRoomId, setReportRoomId] = useState<string | null>(null);
  const [reviewApplicationId, setReviewApplicationId] = useState<string | null>(null);

  const handleSelectTab = (item: BottomNavItem) => {
    if (item.id === "posts" && activeTab !== "posts") {
      setReturnTab(activeTab);
    }

    setSelectedPostId(null);
    setSelectedChatRoomId(null);
    setReportRoomId(null);
    setReviewApplicationId(null);

    if (item.id !== "profile" || activeTab === "profile") {
      setProfileSubScreen(null);
    }

    setActiveTab(item.id);
  };

  if (!fontsLoaded) {
    return <View />;
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
          onOpenChat={() => {
            setReviewApplicationId(null);
            setActiveTab("chat");
            setSelectedChatRoomId("room-1");
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

  const screen =
    activeTab === "bus" ? (
      <RouteScreen onSelectTab={handleSelectTab} />
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
