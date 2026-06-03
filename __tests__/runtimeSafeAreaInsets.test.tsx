import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BottomNav } from "../components/BottomNav";
import { spacing } from "../constants/spacing";
import { bottomNavItems } from "../data/mapHome";
import { ChatScreen } from "../screens/ChatScreen";
import { CreateRecruitmentScreen } from "../screens/CreateRecruitmentScreen";
import { MapScreen } from "../screens/MapScreen";
import { ApplicationReviewScreen } from "../screens/post/ApplicationReviewScreen";
import { PostDetailScreen } from "../screens/post/PostDetailScreen";
import { ProfileEditScreen } from "../screens/profile/ProfileEditScreen";
import { SettingsScreen } from "../screens/profile/SettingsScreen";

const frame = { x: 0, y: 0, width: 390, height: 844 };

function withInsets(bottom: number, children: React.ReactNode) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame,
        insets: { top: 0, right: 0, bottom, left: 0 },
      }}
    >
      {children}
    </SafeAreaProvider>
  );
}

describe("runtime safe area insets", () => {
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
});
