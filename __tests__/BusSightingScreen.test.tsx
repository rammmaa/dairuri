import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native";
import * as Location from "expo-location";
import type { ComponentProps } from "react";

import { BusSightingScreen } from "../screens/BusSightingScreen";
import { resetMockDatabase } from "../services/mockDb";

// expo-location is a native module that cannot run inside jest without a
// stub. We replace the surface we use with bare jest mocks; each test then
// configures the response it wants.
jest.mock("expo-location", () => ({
  PermissionStatus: { GRANTED: "granted", DENIED: "denied", UNDETERMINED: "undetermined" },
  Accuracy: { Balanced: 3 },
  requestForegroundPermissionsAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
}));

const mockedRequestPermissions =
  Location.requestForegroundPermissionsAsync as jest.MockedFunction<
    typeof Location.requestForegroundPermissionsAsync
  >;
const mockedWatchPosition = Location.watchPositionAsync as jest.MockedFunction<
  typeof Location.watchPositionAsync
>;

// Coordinates of the Cheongdo Koaru-bluepin mock stop (id: stop-koaru-bluepin).
// Inference picks the lowest-code route that visits this stop, which is H1.
const NEAREST_STOP_COORDS = { latitude: 35.6474, longitude: 128.7338 };

async function renderBusSightingScreen(
  props: ComponentProps<typeof BusSightingScreen> = {},
) {
  const result = render(<BusSightingScreen {...props} />);

  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  return result;
}

function grantPermissionWithLocation(coords = NEAREST_STOP_COORDS) {
  mockedRequestPermissions.mockResolvedValue({
    status: Location.PermissionStatus.GRANTED,
    granted: true,
    canAskAgain: true,
    expires: "never",
  } as Awaited<ReturnType<typeof Location.requestForegroundPermissionsAsync>>);

  mockedWatchPosition.mockImplementation(async (_options, callback) => {
    callback({
      coords: {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: 5,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    } as Parameters<Parameters<typeof Location.watchPositionAsync>[1]>[0]);
    return { remove: jest.fn() } as Awaited<
      ReturnType<typeof Location.watchPositionAsync>
    >;
  });
}

describe("BusSightingScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetMockDatabase();
  });

  it("shows the permission guidance when location access is denied", async () => {
    mockedRequestPermissions.mockResolvedValue({
      status: Location.PermissionStatus.DENIED,
      granted: false,
      canAskAgain: true,
      expires: "never",
    } as Awaited<ReturnType<typeof Location.requestForegroundPermissionsAsync>>);

    await renderBusSightingScreen();

    await waitFor(() => {
      expect(
        screen.getByText(/위치 권한이 없으면 정류장을 자동으로 인식할 수 없어요/),
      ).toBeTruthy();
    });

    expect(
      screen.getByTestId("bus-sighting-record-button").props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("surfaces the inferred stop name on the recorder current-location chip", async () => {
    grantPermissionWithLocation();

    await renderBusSightingScreen();

    await waitFor(() => {
      expect(screen.getByText(/현위치: 청도 코아루블루핀/)).toBeTruthy();
    });
  });

  it("happy path: bus button -> confirmation -> 맞아요 -> confirmed", async () => {
    grantPermissionWithLocation();

    await renderBusSightingScreen();

    // Wait until inference is ready; the bus button becomes enabled when
    // routes, stops, route-stops, and location have all loaded.
    await waitFor(() => {
      expect(
        screen.getByTestId("bus-sighting-record-button").props.accessibilityState,
      ).toMatchObject({ disabled: false });
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-record-button"));
    });

    // Confirmation state: the inferred (route, stop) panel shows. The stop
    // name now appears in both the headline card and the map preview label,
    // so use getAllByText rather than getByText.
    expect(await screen.findByText("이 정류장이 맞나요?")).toBeTruthy();
    expect(screen.getByText("행복버스 1호선")).toBeTruthy();
    expect(screen.getAllByText("청도 코아루블루핀").length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-accept-button"));
    });

    // Confirmed state: the recent-record card shows the cafe stop name and
    // the 6-char reporter label that the mock API derives from "me".
    const recent = await screen.findByTestId("bus-sighting-recent");
    expect(within(recent).getByText(/청도 코아루블루핀/)).toBeTruthy();
    expect(within(recent).getByText(/기록자 ID:/)).toBeTruthy();
    expect(screen.getByText("확정이 되었습니다")).toBeTruthy();
  });

  it("rejection path: 틀려요 -> route grid -> tile -> stop selection -> 확정 -> confirmed", async () => {
    grantPermissionWithLocation();

    await renderBusSightingScreen();

    await waitFor(() => {
      expect(
        screen.getByTestId("bus-sighting-record-button").props.accessibilityState,
      ).toMatchObject({ disabled: false });
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-record-button"));
    });

    // Reject the inference; the route grid should render with all six tiles.
    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-reject-button"));
    });

    expect(await screen.findByText("기록을 원하시는 호선을 골라주세요")).toBeTruthy();
    for (const code of ["H1", "H2", "H3", "H4", "H5", "H6"]) {
      expect(screen.getByTestId(`bus-sighting-route-tile-${code}`)).toBeTruthy();
    }

    // Pick H6 deliberately so we can tell it apart from the inferred H1.
    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-route-tile-H6"));
    });

    expect(await screen.findByText("해당 노선에서 정류장을 선택해주세요")).toBeTruthy();
    // The final-confirm button stays disabled until a stop is picked.
    expect(
      screen.getByTestId("bus-sighting-final-confirm-button").props
        .accessibilityState,
    ).toMatchObject({ disabled: true });

    // H6 visits koaru-bluepin among others. Pick a different stop from the
    // current GPS position so the test proves the manual stop selection is
    // what gets recorded.
    fireEvent.press(screen.getByTestId("route-map-pin-stop-cheongdo-terminal"));
    expect(
      screen.getByTestId("bus-sighting-final-confirm-button").props
        .accessibilityState,
    ).toMatchObject({ disabled: false });

    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-final-confirm-button"));
    });

    // Confirmed state shows H6 as the recorded route.
    const recent = await screen.findByTestId("bus-sighting-recent");
    expect(within(recent).getByText(/H6/)).toBeTruthy();
    expect(within(recent).getByText(/청도 버스 터미널/)).toBeTruthy();
  });

  it("renders the arrival-times entry only when onOpenArrivalTimes is provided and forwards taps", async () => {
    grantPermissionWithLocation();

    const { rerender } = await renderBusSightingScreen();
    expect(screen.queryByTestId("bus-sighting-arrival-times-entry")).toBeNull();

    const onOpenArrivalTimes = jest.fn();
    rerender(<BusSightingScreen onOpenArrivalTimes={onOpenArrivalTimes} />);
    const entry = await screen.findByTestId("bus-sighting-arrival-times-entry");
    fireEvent.press(entry);
    expect(onOpenArrivalTimes).toHaveBeenCalledTimes(1);
  });

  it("renders the (i) header button only when onOpenRouteInfo is provided and forwards taps", async () => {
    grantPermissionWithLocation();

    const { rerender } = await renderBusSightingScreen();
    expect(screen.queryByTestId("bus-sighting-info-button")).toBeNull();

    const onOpenRouteInfo = jest.fn();
    rerender(<BusSightingScreen onOpenRouteInfo={onOpenRouteInfo} />);
    const infoButton = screen.getByTestId("bus-sighting-info-button");
    expect(infoButton).toBeTruthy();
    fireEvent.press(infoButton);
    expect(onOpenRouteInfo).toHaveBeenCalledTimes(1);
  });

  it("commits the location frozen at bus-button press, not the latest watched location", async () => {
    // Drive the watcher with a sequence: arrive near 청도 코아루블루핀, then
    // drift away to a coordinate that snaps to a different stop. The
    // sighting that gets recorded must use the original position.
    const koaru = { latitude: 35.6474, longitude: 128.7338 };
    const drift = { latitude: 35.6492, longitude: 128.7355 }; // 청도군청

    let positionCallback:
      | ((event: {
          coords: {
            latitude: number;
            longitude: number;
            accuracy: number;
            altitude: number | null;
            altitudeAccuracy: number | null;
            heading: number | null;
            speed: number | null;
          };
          timestamp: number;
        }) => void)
      | null = null;
    mockedRequestPermissions.mockResolvedValue({
      status: Location.PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: "never",
    } as Awaited<ReturnType<typeof Location.requestForegroundPermissionsAsync>>);
    mockedWatchPosition.mockImplementation(async (_options, callback) => {
      positionCallback = callback;
      callback({
        coords: {
          latitude: koaru.latitude,
          longitude: koaru.longitude,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
      return { remove: jest.fn() } as Awaited<
        ReturnType<typeof Location.watchPositionAsync>
      >;
    });

    await renderBusSightingScreen();

    await waitFor(() => {
      expect(
        screen.getByTestId("bus-sighting-record-button").props.accessibilityState,
      ).toMatchObject({ disabled: false });
    });

    // Press the bus button at the koaru-bluepin position.
    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-record-button"));
    });
    expect(await screen.findByText("이 정류장이 맞나요?")).toBeTruthy();
    // Stop name appears in both the header card and the map label.
    expect(screen.getAllByText("청도 코아루블루핀").length).toBeGreaterThan(0);

    // Now drift the position while still on the confirmation screen.
    await act(async () => {
      positionCallback?.({
        coords: {
          latitude: drift.latitude,
          longitude: drift.longitude,
          accuracy: 5,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-accept-button"));
    });

    // The mock API records the coordinate it was called with on the
    // sighting record. Verify the recorded latitude matches the koaru
    // press time, not the post-drift coordinate.
    const recent = await screen.findByTestId("bus-sighting-recent");
    // Stop name in the recent card reflects the snap that happened at
    // press time. Drifting to cheongdo-office would have snapped to a
    // different stop, so seeing koaru here proves the freeze worked.
    expect(within(recent).getByText(/청도 코아루블루핀/)).toBeTruthy();
  });

  it("back arrow walks the state machine in reverse", async () => {
    grantPermissionWithLocation();
    const onBack = jest.fn();

    await renderBusSightingScreen({ onBack });

    await waitFor(() => {
      expect(
        screen.getByTestId("bus-sighting-record-button").props.accessibilityState,
      ).toMatchObject({ disabled: false });
    });

    // Enter confirmation, then rejection, then stop-selection.
    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-record-button"));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-reject-button"));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-route-tile-H2"));
    });
    expect(screen.getByText("해당 노선에서 정류장을 선택해주세요")).toBeTruthy();

    // First back: stop-selection -> route-grid
    fireEvent.press(screen.getByLabelText("뒤로가기"));
    expect(await screen.findByText("기록을 원하시는 호선을 골라주세요")).toBeTruthy();

    // Second back: route-grid -> confirmation
    fireEvent.press(screen.getByLabelText("뒤로가기"));
    expect(await screen.findByText("이 정류장이 맞나요?")).toBeTruthy();

    // Third back: confirmation -> recorder
    fireEvent.press(screen.getByLabelText("뒤로가기"));
    await waitFor(() => {
      expect(screen.getByText("방금 버스 봤어요!")).toBeTruthy();
    });
    expect(onBack).not.toHaveBeenCalled();

    // Fourth back from recorder pops the screen.
    fireEvent.press(screen.getByLabelText("뒤로가기"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
