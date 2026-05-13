jest.mock("@expo/vector-icons", () => {
  function Feather({ name }: { name: string }) {
    const React = require("react");

    return React.createElement(
      "Text",
      {
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants",
      },
      name,
    );
  }

  Feather.glyphMap = {};

  return { Feather };
});

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");

  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement("View", null, children),
    SafeAreaView: ({
      children,
      style,
    }: {
      children: React.ReactNode;
      style?: unknown;
    }) => React.createElement("View", { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock("react-native-maps", () => {
  const React = require("react");

  function MapView({
    children,
    ...props
  }: {
    children?: React.ReactNode;
  }) {
    return React.createElement("View", props, children);
  }

  function Marker(props: Record<string, unknown>) {
    return React.createElement("View", props);
  }

  return {
    __esModule: true,
    default: MapView,
    Marker,
    PROVIDER_GOOGLE: "google",
  };
});
