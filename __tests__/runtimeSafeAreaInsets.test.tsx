import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BottomNav } from "../components/BottomNav";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { bottomNavItems } from "../data/mapHome";
import { ChatScreen } from "../screens/ChatScreen";
import { ChatRoomScreen } from "../screens/chat/ChatRoomScreen";
import { CreateRecruitmentScreen } from "../screens/CreateRecruitmentScreen";
import { MapScreen } from "../screens/MapScreen";
import { MyPageScreen } from "../screens/MyPageScreen";
import { ApplicationReviewScreen } from "../screens/post/ApplicationReviewScreen";
import { PostDetailScreen } from "../screens/post/PostDetailScreen";
import { ProfileEditScreen } from "../screens/profile/ProfileEditScreen";
import { RouteScreen } from "../screens/RouteScreen";
import { SettingsScreen } from "../screens/profile/SettingsScreen";
import { ProfileInfoScreen } from "../screens/profile/ProfileInfoScreen";

const frame = { x: 0, y: 0, width: 390, height: 844 };

function withInsets(
  insetsOrBottom: number | Partial<{ top: number; right: number; bottom: number; left: number }>,
  children: React.ReactNode,
) {
  const insets =
    typeof insetsOrBottom === "number"
      ? { top: 0, right: 0, bottom: insetsOrBottom, left: 0 }
      : { top: 0, right: 0, bottom: 0, left: 0, ...insetsOrBottom };

  return (
    <SafeAreaProvider
      initialMetrics={{
        frame,
        insets,
      }}
    >
      {children}
    </SafeAreaProvider>
  );
}

describe("runtime safe area insets", () => {
  const appHeaderBaseHeight = 88;
  const appHeaderTopPadding = 36;

  function expectAppHeader(
    testID: string,
    topInset: number,
    titleSize: "standard" | "large" = "standard",
  ) {
    const headerStyle = StyleSheet.flatten(screen.getByTestId(testID).props.style);
    const titleStyle = StyleSheet.flatten(
      screen.getByTestId(`${testID}-title`).props.style,
    );
    const expectedFontSize =
      titleSize === "large" ? typography.size.title : typography.size.lg;
    const expectedLineHeight =
      titleSize === "large" ? typography.lineHeight.title : typography.lineHeight.lg;

    expect(headerStyle.minHeight).toBe(appHeaderBaseHeight + topInset);
    expect(headerStyle.paddingTop).toBe(appHeaderTopPadding + topInset);
    expect(titleStyle.fontFamily).toBe(typography.family.bold);
    expect(titleStyle.fontSize).toBe(expectedFontSize);
    expect(titleStyle.lineHeight).toBe(expectedLineHeight);
  }

  it("uses the provider bottom inset for the bottom navigation", () => {
    const { unmount } = render(
      withInsets(
        0,
        <BottomNav items={bottomNavItems} selectedId="map" testID="runtime-bottom-nav" />,
      ),
    );

    const zeroInsetStyle = StyleSheet.flatten(
      screen.getByTestId("runtime-bottom-nav").props.style,
    );

    expect(zeroInsetStyle.height).toBe(spacing.navHeight);
    expect(zeroInsetStyle.paddingBottom).toBe(8);

    unmount();

    render(
      withInsets(
        34,
        <BottomNav items={bottomNavItems} selectedId="map" testID="runtime-bottom-nav" />,
      ),
    );

    const navStyle = StyleSheet.flatten(screen.getByTestId("runtime-bottom-nav").props.style);

    expect(navStyle.height).toBe(spacing.navHeight + 34);
    expect(navStyle.paddingBottom).toBe(8 + 34);
  });

  it("keeps the post detail footer above the provider bottom inset", () => {
    const { unmount } = render(withInsets(0, <PostDetailScreen postId="carpool-1" />));

    const zeroInsetFooterStyle = StyleSheet.flatten(
      screen.getByTestId("post-detail-footer").props.style,
    );

    expect(zeroInsetFooterStyle.minHeight).toBe(76);
    expect(zeroInsetFooterStyle.paddingBottom).toBe(14);

    unmount();

    render(withInsets(34, <PostDetailScreen postId="carpool-1" />));

    const footerStyle = StyleSheet.flatten(
      screen.getByTestId("post-detail-footer").props.style,
    );

    expect(footerStyle.minHeight).toBe(76 + 34);
    expect(footerStyle.paddingBottom).toBe(14 + 34);
  });

  it("keeps fixed creation and chat controls above the provider bottom inset", () => {
    render(withInsets(34, <CreateRecruitmentScreen />));

    const recruitmentFooterStyle = StyleSheet.flatten(
      screen.getByTestId("recruitment-footer").props.style,
    );
    const recruitmentContentStyle = StyleSheet.flatten(
      screen.getByTestId("recruitment-create-scroll").props.contentContainerStyle,
    );

    expect(recruitmentFooterStyle.bottom).toBe(34 + 34);
    expect(recruitmentContentStyle.paddingBottom).toBe(126 + 34);

    render(withInsets(34, <ChatScreen />));
    fireEvent.press(screen.getByTestId("chat-room-brungpot"));

    const inputBarStyle = StyleSheet.flatten(
      screen.getByTestId("chat-room-input-bar").props.style,
    );

    expect(inputBarStyle.bottom).toBe(36 + 34);
  });

  it("adds the provider bottom inset to fixed profile and review footers", () => {
    render(withInsets(34, <ProfileEditScreen />));

    expect(
      StyleSheet.flatten(screen.getByTestId("profile-edit-footer").props.style)
        .paddingBottom,
    ).toBe(24 + 34);
    expect(
      StyleSheet.flatten(
        screen.getByTestId("profile-edit-scroll").props.contentContainerStyle,
      ).paddingBottom,
    ).toBe(120 + 34);

    render(withInsets(34, <SettingsScreen />));

    expect(
      StyleSheet.flatten(screen.getByTestId("settings-footer").props.style)
        .paddingBottom,
    ).toBe(24 + 34);
    expect(
      StyleSheet.flatten(screen.getByTestId("settings-scroll").props.contentContainerStyle)
        .paddingBottom,
    ).toBe(124 + 34);

    render(withInsets(34, <ApplicationReviewScreen applicationId="application-1" />));

    expect(
      StyleSheet.flatten(screen.getByTestId("application-review-footer").props.style)
        .paddingBottom,
    ).toBe(16 + 34);
  });

  it("keeps the map bottom sheet above the safe-area-aware bottom navigation", () => {
    render(withInsets(34, <MapScreen />));

    const bottomSheetStyle = StyleSheet.flatten(
      screen.getByTestId("map-home-bottom-sheet").props.style,
    );

    expect(bottomSheetStyle.bottom).toBe(spacing.navHeight + 34);
  });

  it("adds the provider top inset to custom top-level app surfaces", () => {
    const top = 59;
    const { unmount: unmountMap } = render(
      withInsets({ top, bottom: 34 }, <MapScreen />),
    );

    expect(
      StyleSheet.flatten(screen.getByTestId("map-home-top-overlay").props.style)
        .top,
    ).toBe(top + 12);

    fireEvent.press(screen.getByTestId("map-home-category-bus"));

    expect(
      StyleSheet.flatten(screen.getByTestId("map-home-bottom-sheet").props.style)
        .top,
    ).toBe(top + 12);

    unmountMap();

    const { unmount: unmountRoute } = render(withInsets({ top }, <RouteScreen />));

    expectAppHeader("route-header", top, "large");

    unmountRoute();

    const { unmount: unmountRecruitment } = render(
      withInsets({ top }, <CreateRecruitmentScreen />),
    );

    expect(
      StyleSheet.flatten(
        screen.getByTestId("recruitment-create-scroll").props.contentContainerStyle,
      ).paddingTop,
    ).toBe(28 + top);

    unmountRecruitment();

    const { unmount: unmountProfileHome } = render(
      withInsets({ top, bottom: 34 }, <MyPageScreen />),
    );

    const profileHomeHeaderStyle = StyleSheet.flatten(
      screen.getByTestId("profile-home-header").props.style,
    );

    expect(profileHomeHeaderStyle.minHeight).toBe(appHeaderBaseHeight + top);
    expect(profileHomeHeaderStyle.paddingTop).toBe(appHeaderTopPadding + top);
    expectAppHeader("profile-home-header", top, "large");

    unmountProfileHome();

    const { unmount: unmountChatList } = render(
      withInsets({ top }, <ChatScreen />),
    );

    expectAppHeader("chat-list-header", top, "large");

    fireEvent.press(screen.getByTestId("chat-room-brungpot"));

    const inlineHeaderStyle = StyleSheet.flatten(
      screen.getByTestId("chat-inline-header").props.style,
    );

    expect(inlineHeaderStyle.paddingTop).toBe(appHeaderTopPadding + top);
    expect(inlineHeaderStyle.minHeight).toBe(appHeaderBaseHeight + 44 + top);

    unmountChatList();

    const { unmount: unmountSettings } = render(
      withInsets({ top }, <SettingsScreen onBack={jest.fn()} />),
    );

    expectAppHeader("settings-header", top);

    unmountSettings();

    const { unmount: unmountNotice } = render(
      withInsets({ top }, <ProfileInfoScreen kind="notice" onBack={jest.fn()} />),
    );

    expectAppHeader("profile-info-notice-header", top);

    unmountNotice();

    const { unmount: unmountChat } = render(
      withInsets({ top }, <ChatRoomScreen roomId="room-1" />),
    );

    const chatRoomHeaderStyle = StyleSheet.flatten(
      screen.getByTestId("chat-room-header").props.style,
    );

    expect(chatRoomHeaderStyle.paddingTop).toBe(appHeaderTopPadding + top);
    expect(chatRoomHeaderStyle.minHeight).toBe(appHeaderBaseHeight + top);

    unmountChat();
  });
});
