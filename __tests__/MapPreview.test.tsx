import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { MapPreview } from "../components/MapPreview";

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
});
