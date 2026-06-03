import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native";
import * as Location from "expo-location";
import { StyleSheet } from "react-native";

import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { MapScreen } from "../screens/MapScreen";

jest.mock("expo-location", () => ({
  Accuracy: {
    Balanced: 3,
  },
  getCurrentPositionAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
}));

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

function getTestStyle(testID: string) {
  const rawStyle = screen.getByTestId(testID).props.style;
  const resolvedStyle =
    typeof rawStyle === "function" ? rawStyle({ pressed: false }) : rawStyle;

  return StyleSheet.flatten(resolvedStyle);
}

describe("MapScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
      granted: false,
    } as never);
    jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({
      coords: {
        latitude: 35.7153,
        longitude: 128.7473,
      },
    } as never);
  });

  it("renders the home map search, count, first card, and bottom tabs", () => {
    render(<MapScreen />);

    expect(screen.getByText("여기서 검색")).toBeTruthy();
    expect(screen.getByText("총")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("다로리 카페 매주 같이 가실 분 구해요")).toBeTruthy();
    expect(screen.getByText("농촌 일손과 카페 보조 도울 수 있어요")).toBeTruthy();

    const bottomNav = within(screen.getByTestId("map-home-bottom-nav"));

    for (const label of ["지도", "버스", "모집글", "채팅", "프로필"]) {
      expect(bottomNav.getByText(label)).toBeTruthy();
    }
  });

  it("uses the gray rounded-card home list design", () => {
    render(<MapScreen />);

    expect(
      StyleSheet.flatten(screen.getByTestId("map-home-bottom-sheet").props.style)
        .backgroundColor,
    ).toBe(colors.homeListBackground);
    expect(
      StyleSheet.flatten(screen.getByTestId("map-home-sheet-scroll").props.style)
        .backgroundColor,
    ).toBe(colors.homeListBackground);
    expect(
      StyleSheet.flatten(screen.getByTestId("map-home-card-list").props.style).gap,
    ).toBe(spacing.homeListGap);

    const firstCardStyleProp = screen.getByTestId("recruitment-card-post-1").props
      .style;
    const firstCardStyle = StyleSheet.flatten(
      typeof firstCardStyleProp === "function"
        ? firstCardStyleProp({ pressed: false })
        : firstCardStyleProp,
    );

    expect(firstCardStyle.backgroundColor).toBe(colors.surface);
    expect(firstCardStyle.borderRadius).toBe(spacing.homeCardRadius);
    expect(firstCardStyle.paddingHorizontal).toBe(spacing.homeCardPaddingX);
    expect(firstCardStyle.paddingVertical).toBe(spacing.homeCardPaddingY);
    expect(firstCardStyle.borderBottomWidth).toBeUndefined();
  });

  it("uses the current-location icon for the top category chips", () => {
    render(<MapScreen />);

    expect(screen.getAllByTestId("category-current-location-icon")).toHaveLength(3);
  });

  it("exposes map search, location callbacks, and ride pins", () => {
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
    fireEvent.press(screen.getByTestId("map-preview-marker-ride-carpool-1"));

    expect(handleSearchPress).toHaveBeenCalledTimes(1);
    expect(handleCurrentLocationPress).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("map-preview-marker-cafe")).toBeNull();
    expect(handleMarkerPress).toHaveBeenCalledWith("ride-carpool-1");
  });

  it("opens a real map search field from the home search bar", () => {
    render(<MapScreen />);

    fireEvent.press(screen.getByTestId("map-home-search-button"));

    expect(screen.getByTestId("map-home-search-input")).toBeTruthy();
    expect(screen.getByPlaceholderText("장소 검색")).toBeTruthy();
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

  it("requests native Expo location when browser geolocation is unavailable", async () => {
    const originalNavigator = global.navigator;

    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: {},
    });
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValueOnce({
      granted: true,
    } as never);

    try {
      render(<MapScreen />);

      fireEvent.press(screen.getByTestId("map-home-current-location-button"));

      await waitFor(() => {
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
      });
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          accuracy: Location.Accuracy.Balanced,
        }),
      );
    } finally {
      Object.defineProperty(global, "navigator", {
        configurable: true,
        value: originalNavigator,
      });
    }
  });

  it("filters map posts by category and multi-selects weekday and time controls", () => {
    render(<MapScreen />);

    expect(screen.getByText("5")).toBeTruthy();

    fireEvent.press(screen.getByTestId("map-home-category-work"));
    expect(screen.getByTestId("map-home-category-work").props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByText("2")).toBeTruthy();

    fireEvent.press(screen.getByTestId("map-home-category-work"));
    expect(screen.getByText("5")).toBeTruthy();

    expect(screen.getByText("요일")).toBeTruthy();
    expect(screen.getByText("시간")).toBeTruthy();
    expect(screen.queryByText("출발 장소")).toBeNull();
    expect(screen.queryByTestId("map-home-weekday-option-화")).toBeNull();
    expect(screen.queryByTestId("map-home-time-option-오전")).toBeNull();

    fireEvent.press(screen.getByTestId("map-home-filter-weekday"));
    expect(screen.getByTestId("map-home-filter-dropdown-weekday")).toBeTruthy();
    expect(getTestStyle("map-home-filter-dropdown-weekday").left).toBe(0);
    expect(getTestStyle("map-home-filter-dropdown-weekday").right).toBe(0);
    expect(getTestStyle("map-home-filter-dropdown-weekday").gap).toBeUndefined();
    expect(getTestStyle("map-home-filter-dropdown-weekday").backgroundColor).toBe(
      colors.surface,
    );
    expect(getTestStyle("map-home-filter-dropdown-weekday").borderRadius).toBe(18);
    expect(getTestStyle("map-home-filter-dropdown-weekday").overflow).toBe(
      "hidden",
    );
    expect(screen.getByTestId("map-home-weekday-option-화")).toBeTruthy();
    expect(screen.queryByTestId("map-home-filter-dropdown-time")).toBeNull();
    fireEvent.press(screen.getByTestId("map-home-weekday-option-화"));
    expect(
      screen.getByTestId("map-home-weekday-option-화").props.accessibilityState,
    ).toMatchObject({
      selected: true,
    });
    expect(getTestStyle("map-home-filter-weekday").borderColor).toBe(colors.mint);
    expect(getTestStyle("map-home-weekday-option-화").backgroundColor).toBe(
      colors.blue,
    );
    expect(getTestStyle("map-home-weekday-option-화").borderBottomColor).toBe(
      colors.surface,
    );
    expect(
      StyleSheet.flatten(
        within(screen.getByTestId("map-home-weekday-option-화")).getByText("화")
          .props.style,
      ).color,
    ).toBe(colors.surface);
    expect(screen.getByText("3")).toBeTruthy();

    fireEvent.press(screen.getByTestId("map-home-weekday-option-수"));
    expect(
      screen.getByTestId("map-home-weekday-option-수").props.accessibilityState,
    ).toMatchObject({
      selected: true,
    });
    expect(screen.getByText("5")).toBeTruthy();

    fireEvent.press(screen.getByTestId("map-home-filter-time"));
    expect(screen.queryByTestId("map-home-filter-dropdown-weekday")).toBeNull();
    expect(screen.getByTestId("map-home-filter-dropdown-time")).toBeTruthy();
    expect(getTestStyle("map-home-filter-dropdown-time").left).toBe(0);
    expect(getTestStyle("map-home-filter-dropdown-time").right).toBe(0);
    expect(getTestStyle("map-home-filter-dropdown-time").gap).toBeUndefined();
    expect(getTestStyle("map-home-filter-dropdown-time").backgroundColor).toBe(
      colors.surface,
    );
    expect(getTestStyle("map-home-filter-dropdown-time").borderRadius).toBe(18);
    expect(getTestStyle("map-home-filter-dropdown-time").overflow).toBe("hidden");
    expect(screen.getByTestId("map-home-time-option-오전")).toBeTruthy();
    fireEvent.press(screen.getByTestId("map-home-time-option-오전"));
    expect(
      screen.getByTestId("map-home-time-option-오전").props.accessibilityState,
    ).toMatchObject({
      selected: true,
    });
    expect(getTestStyle("map-home-filter-time").borderColor).toBe(colors.mint);
    expect(getTestStyle("map-home-time-option-오전").backgroundColor).toBe(
      colors.blue,
    );
    expect(getTestStyle("map-home-time-option-오전").borderBottomColor).toBe(
      colors.surface,
    );
    expect(
      StyleSheet.flatten(
        within(screen.getByTestId("map-home-time-option-오전")).getByText("오전")
          .props.style,
      ).color,
    ).toBe(colors.surface);
    expect(screen.getByText("2")).toBeTruthy();

    fireEvent.press(screen.getByTestId("map-home-time-option-오후"));
    expect(
      screen.getByTestId("map-home-time-option-오후").props.accessibilityState,
    ).toMatchObject({
      selected: true,
    });
    expect(screen.getByText("5")).toBeTruthy();

    fireEvent.press(screen.getByTestId("map-home-sort-filter"));
    expect(screen.getByText("최신순")).toBeTruthy();

    fireEvent.press(screen.getByTestId("map-home-sort-filter"));
    expect(screen.getByText("오래된순")).toBeTruthy();
  });

  it("opens the bus sighting archive panel and saves the current time and location", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 15, 12, 1, 19));

    try {
      render(<MapScreen />);

      fireEvent.press(screen.getByTestId("map-home-category-bus"));

      expect(screen.getByText("방금 버스 봤어요!")).toBeTruthy();
      expect(screen.getByText("12:01:19")).toBeTruthy();
      expect(screen.getByText("현위치: 확인 중")).toBeTruthy();

      fireEvent.press(screen.getByTestId("map-home-bus-sighting-save"));

      expect(screen.getByText("최근 기록")).toBeTruthy();
      expect(screen.getByText("12:01:19 · 확인 중")).toBeTruthy();
    } finally {
      jest.useRealTimers();
    }
  });

  it("lets the bus archive panel move close to the top of the map", () => {
    render(<MapScreen />);

    fireEvent.press(screen.getByTestId("map-home-category-bus"));

    expect(
      StyleSheet.flatten(screen.getByTestId("map-home-bottom-sheet").props.style)
        .top,
    ).toBe(56);

    const dragHandle = screen.getByTestId("map-home-sheet-drag-handle");

    fireEvent(dragHandle, "responderGrant", createPanEvent(56, 56));
    fireEvent(dragHandle, "responderMove", createPanEvent(56, -80));
    fireEvent(dragHandle, "responderRelease", createPanEvent(56, -80));

    expect(
      StyleSheet.flatten(screen.getByTestId("map-home-bottom-sheet").props.style)
        .top,
    ).toBe(56);
  });

  it("toggles weekday and time filter chips independently", () => {
    render(<MapScreen />);

    expect(screen.getByText("요일")).toBeTruthy();
    expect(screen.getByText("시간")).toBeTruthy();
    expect(screen.queryByLabelText("출발 장소")).toBeNull();
    expect(screen.queryByTestId("map-home-weekday-option-화")).toBeNull();
    expect(screen.queryByTestId("map-home-time-option-오전")).toBeNull();

    fireEvent.press(screen.getByTestId("map-home-filter-weekday"));
    fireEvent.press(screen.getByTestId("map-home-weekday-option-화"));

    expect(
      screen.getByTestId("map-home-weekday-option-화").props.accessibilityState,
    ).toMatchObject({
      selected: true,
    });

    fireEvent.press(screen.getByTestId("map-home-filter-time"));
    fireEvent.press(screen.getByTestId("map-home-time-option-오전"));
    fireEvent.press(screen.getByTestId("map-home-time-option-오후"));

    expect(
      screen.getByTestId("map-home-time-option-오전").props.accessibilityState,
    ).toMatchObject({
      selected: true,
    });
    expect(
      screen.getByTestId("map-home-time-option-오후").props.accessibilityState,
    ).toMatchObject({
      selected: true,
    });

    fireEvent.press(screen.getByTestId("map-home-time-option-오전"));

    expect(
      screen.getByTestId("map-home-time-option-오전").props.accessibilityState,
    ).toMatchObject({
      selected: false,
    });

    fireEvent.press(screen.getByTestId("map-home-filter-time"));
    expect(screen.queryByTestId("map-home-time-option-오전")).toBeNull();
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
