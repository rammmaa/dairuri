import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { MapScreen } from "../screens/MapScreen";

function createPanEvent(previousPageY: number, currentPageY: number) {
  return {
    nativeEvent: {
      touches: [{ pageX: 0, pageY: currentPageY }],
      changedTouches: [{ pageX: 0, pageY: currentPageY }],
    },
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: Date.now(),
      touchBank: [
        {
          touchActive: true,
          currentPageX: 0,
          currentPageY,
          currentTimeStamp: Date.now(),
          previousPageX: 0,
          previousPageY,
          previousTimeStamp: Date.now() - 1,
        },
      ],
    },
  };
}

describe("MapScreen", () => {
  it("renders the home map search, count, first card, and bottom tabs", () => {
    render(<MapScreen />);

    expect(screen.getByText("여기서 검색")).toBeTruthy();
    expect(screen.getByText("총")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getAllByText("다로리 카페 매주 같이 가실 분 구해요")).toHaveLength(2);

    const bottomNav = within(screen.getByTestId("map-home-bottom-nav"));

    for (const label of ["지도", "버스", "모집글", "채팅", "프로필"]) {
      expect(bottomNav.getByText(label)).toBeTruthy();
    }
  });

  it("uses the current-location icon for the top category chips", () => {
    render(<MapScreen />);

    expect(screen.getAllByTestId("category-current-location-icon")).toHaveLength(3);
  });

  it("exposes no-op-safe map search, location, and marker callbacks", () => {
    const handleSearchPress = jest.fn();
    const handleCurrentLocationPress = jest.fn();
    const handleMarkerPress = jest.fn();

    render(
      <MapScreen
        onSearchPress={handleSearchPress}
        onCurrentLocationPress={handleCurrentLocationPress}
        onSelectMapMarker={handleMarkerPress}
      />,
    );

    fireEvent.press(screen.getByTestId("map-home-search-button"));
    fireEvent.press(screen.getByTestId("map-home-current-location-button"));
    fireEvent.press(screen.getByTestId("map-preview-marker-cafe"));

    expect(handleSearchPress).toHaveBeenCalledTimes(1);
    expect(handleCurrentLocationPress).toHaveBeenCalledTimes(1);
    expect(handleMarkerPress).toHaveBeenCalledWith("cafe");
  });

  it("requests browser location when pressing the current-location button", () => {
    const originalNavigator = global.navigator;
    const getCurrentPosition = jest.fn();

    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: {
        geolocation: {
          getCurrentPosition,
        },
      },
    });

    try {
      render(<MapScreen />);

      fireEvent.press(screen.getByTestId("map-home-current-location-button"));

      expect(getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
        }),
      );
    } finally {
      Object.defineProperty(global, "navigator", {
        configurable: true,
        value: originalNavigator,
      });
    }
  });

  it("filters map posts by category and cycles date, time, and sort controls", () => {
    render(<MapScreen />);

    expect(screen.getByText("5")).toBeTruthy();

    fireEvent.press(screen.getByTestId("map-home-category-work"));
    expect(screen.getByTestId("map-home-category-work").props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByText("2")).toBeTruthy();

    fireEvent.press(screen.getByTestId("map-home-category-work"));
    expect(screen.getByText("5")).toBeTruthy();

    fireEvent.press(screen.getByTestId("map-home-filter-날짜"));
    expect(screen.getByText("오늘")).toBeTruthy();

    fireEvent.press(screen.getByTestId("map-home-filter-시간"));
    expect(screen.getByText("오후")).toBeTruthy();

    fireEvent.press(screen.getByTestId("map-home-sort-filter"));
    expect(screen.getByText("최신순")).toBeTruthy();

    fireEvent.press(screen.getByTestId("map-home-sort-filter"));
    expect(screen.getByText("오래된순")).toBeTruthy();
  });

  it("toggles the departure place bottom filter chip selection", () => {
    render(<MapScreen />);

    expect(screen.getByText("날짜")).toBeTruthy();
    expect(screen.getByText("시간")).toBeTruthy();
    const departureChip = screen.getByLabelText("출발 장소");

    fireEvent.press(departureChip);

    const selectedDepartureChip = screen.getByLabelText("남성현역");
    expect(screen.getAllByText("남성현역").length).toBeGreaterThan(0);
    expect(selectedDepartureChip.props.accessibilityState).toMatchObject({
      selected: true,
    });

    fireEvent.press(selectedDepartureChip);

    expect(screen.getByText("출발 장소")).toBeTruthy();
    expect(screen.getByLabelText("출발 장소").props.accessibilityState).toMatchObject({
      selected: false,
    });
  });

  it("moves the bottom sheet when the drag handle is moved by touch", () => {
    render(<MapScreen />);

    expect(
      StyleSheet.flatten(screen.getByTestId("map-home-bottom-sheet").props.style)
        .top,
    ).toBe(486);

    const dragHandle = screen.getByTestId("map-home-sheet-drag-handle");

    fireEvent(dragHandle, "responderGrant", createPanEvent(486, 486));
    fireEvent(dragHandle, "responderMove", createPanEvent(486, 366));
    fireEvent(dragHandle, "responderRelease", createPanEvent(486, 366));

    expect(
      StyleSheet.flatten(screen.getByTestId("map-home-bottom-sheet").props.style)
        .top,
    ).toBe(366);
  });
});
