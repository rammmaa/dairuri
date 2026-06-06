import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { MapPreview } from "../components/MapPreview";
import { NativeNaverMapSurface } from "../components/NativeNaverMapSurface";

jest.mock("@mj-studio/react-native-naver-map", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    NaverMapView: ({ children, ...props }: { children?: React.ReactNode }) => (
      <View testID="mock-native-map-view" {...props}>
        {children}
      </View>
    ),
    NaverMapCircleOverlay: (props: Record<string, unknown>) => (
      <View testID="mock-native-map-circle" {...props} />
    ),
    NaverMapMarkerOverlay: (props: Record<string, unknown>) => (
      <View testID="mock-native-map-marker" {...props} />
    ),
  };
});

function createPanEvent(previousPageX: number, previousPageY: number, currentPageX: number, currentPageY: number) {
  return {
    nativeEvent: {
      touches: [{ pageX: currentPageX, pageY: currentPageY }],
      changedTouches: [{ pageX: currentPageX, pageY: currentPageY }],
    },
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: Date.now(),
      touchBank: [
        {
          touchActive: true,
          currentPageX,
          currentPageY,
          currentTimeStamp: Date.now(),
          previousPageX,
          previousPageY,
          previousTimeStamp: Date.now() - 1,
        },
      ],
    },
  };
}

describe("MapPreview", () => {
  it("lets the fallback map surface move with a touch drag", () => {
    render(<MapPreview />);

    const panLayer = screen.getByTestId("map-preview-pan-layer");

    expect(StyleSheet.flatten(panLayer.props.style).transform).toMatchObject([
      { translateX: 0 },
      { translateY: 0 },
    ]);

    fireEvent(panLayer, "responderGrant", createPanEvent(120, 200, 120, 200));
    fireEvent(panLayer, "responderMove", createPanEvent(120, 200, 156, 172));
    fireEvent(panLayer, "responderRelease", createPanEvent(120, 200, 156, 172));

    expect(StyleSheet.flatten(screen.getByTestId("map-preview-pan-layer").props.style).transform).toMatchObject([
      { translateX: 36 },
      { translateY: -28 },
    ]);
  });

  it("does not render app-level map pins over the map surface", () => {
    render(<MapPreview />);

    expect(screen.queryByTestId("map-preview-marker-cafe")).toBeNull();
    expect(screen.queryByTestId("map-preview-marker-bus")).toBeNull();
    expect(screen.queryByTestId("map-preview-marker-library")).toBeNull();
  });

  it("does not render decorative fallback map text labels", () => {
    render(<MapPreview />);

    expect(screen.queryByText("다로리로")).toBeNull();
    expect(screen.queryByText("중앙대로")).toBeNull();
    expect(screen.queryByText("카페거리")).toBeNull();
  });

  it("renders explicit app-level map pins and forwards marker presses", () => {
    const handleMarkerPress = jest.fn();

    render(
      <MapPreview
        markers={[
          {
            id: "ride-carpool-1",
            label: "다로리 카페 라이드",
            latitude: 35.6474,
            longitude: 128.7338,
          },
        ]}
        onMarkerPress={handleMarkerPress}
      />,
    );

    fireEvent.press(screen.getByTestId("map-preview-marker-ride-carpool-1"));

    expect(handleMarkerPress).toHaveBeenCalledWith("ride-carpool-1");
  });

  it("does not show recruitment titles as native map marker captions", () => {
    const handleMarkerPress = jest.fn();

    render(
      <NativeNaverMapSurface
        markers={[
          {
            id: "ride-carpool-1",
            label: "다로라 회관 데려다주실 분",
            latitude: 35.6474,
            longitude: 128.7338,
          },
        ]}
        initialCamera={{
          latitude: 35.6482,
          longitude: 128.7358,
          zoom: 15,
        }}
        onMarkerPress={handleMarkerPress}
      />,
    );

    const marker = screen
      .getAllByTestId("mock-native-map-marker")
      .find((currentMarker) => currentMarker.props.image?.symbol === "green");

    expect(marker?.props.caption).toBeUndefined();

    fireEvent(marker!, "tap");

    expect(handleMarkerPress).toHaveBeenCalledWith("ride-carpool-1");
  });

  it("centers the native current-location circle and dot on the same coordinate", () => {
    render(
      <NativeNaverMapSurface
        markers={[]}
        initialCamera={{
          latitude: 35.6482,
          longitude: 128.7358,
          zoom: 15,
        }}
        camera={{
          latitude: 35.7153,
          longitude: 128.7473,
          zoom: 16,
        }}
      />,
    );

    const nativeMap = screen.getByTestId("mock-native-map-view");
    const circle = screen.getByTestId("mock-native-map-circle");
    const dot = screen
      .getAllByTestId("mock-native-map-marker")
      .find((marker) => marker.props.width === 18);

    expect(nativeMap.props.locationOverlay).toBeUndefined();
    expect(circle.props.latitude).toBe(35.7153);
    expect(circle.props.longitude).toBe(128.7473);
    expect(dot?.props.latitude).toBe(35.7153);
    expect(dot?.props.longitude).toBe(128.7473);
    expect(dot?.props.anchor).toEqual({ x: 0.5, y: 0.5 });
  });
});
