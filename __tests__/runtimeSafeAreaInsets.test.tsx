import { StyleSheet } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BottomNav } from "../components/BottomNav";
import { spacing } from "../constants/spacing";
import { bottomNavItems } from "../data/mapHome";
import { PostDetailScreen } from "../screens/post/PostDetailScreen";

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
});
