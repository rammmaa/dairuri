import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native";
import * as Location from "expo-location";

import { BusSightingScreen } from "../screens/BusSightingScreen";

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

// Coordinates of the Darori Cafe mock stop, so the in-screen snap resolves to it.
const CAFE_COORDS = { latitude: 35.6474, longitude: 128.7338 };

function grantPermissionWithLocation(coords = CAFE_COORDS) {
  mockedRequestPermissions.mockResolvedValue({
    status: Location.PermissionStatus.GRANTED,
    granted: true,
    canAskAgain: true,
    expires: "never",
  } as Awaited<ReturnType<typeof Location.requestForegroundPermissionsAsync>>);

  mockedWatchPosition.mockImplementation(async (_options, callback) => {
    // Fire one position update immediately so the screen leaves the loading
    // state on the next microtask.
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
  });

  it("shows the permission guidance when location access is denied", async () => {
    mockedRequestPermissions.mockResolvedValue({
      status: Location.PermissionStatus.DENIED,
      granted: false,
      canAskAgain: true,
      expires: "never",
    } as Awaited<ReturnType<typeof Location.requestForegroundPermissionsAsync>>);

    render(<BusSightingScreen />);

    await waitFor(() => {
      expect(
        screen.getByText(/위치 권한이 없으면 정류장을 자동으로 인식할 수 없어요/),
      ).toBeTruthy();
    });

    expect(screen.getByTestId("bus-sighting-record-button").props.accessibilityState).toMatchObject(
      { disabled: true },
    );
  });

  it("resolves the nearest stop name from the live location", async () => {
    grantPermissionWithLocation();

    render(<BusSightingScreen />);

    await waitFor(() => {
      expect(screen.getByText(/현위치: 다로리 카페/)).toBeTruthy();
    });
  });

  it("enables the record button only after a route is selected, then surfaces the record card", async () => {
    grantPermissionWithLocation();

    render(<BusSightingScreen />);

    // Wait until routes are loaded; the D-01 chip should appear.
    const routeChip = await screen.findByLabelText("D-01 노선");

    // Before route selection: button disabled and the help text nudges the user
    // to pick a route.
    expect(screen.getByText(/보신 버스의 노선을 골라주세요/)).toBeTruthy();
    expect(
      screen.getByTestId("bus-sighting-record-button").props.accessibilityState,
    ).toMatchObject({ disabled: true });

    fireEvent.press(routeChip);

    // After route selection: button enabled.
    await waitFor(() => {
      expect(
        screen.getByTestId("bus-sighting-record-button").props.accessibilityState,
      ).toMatchObject({ disabled: false });
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-record-button"));
    });

    // The recent-record card should render with the cafe stop name and the
    // 6-char reporter label that the mock API derives from "me". We scope the
    // query to the card because the cafe name also appears in the live
    // current-location chip above.
    const recent = await screen.findByTestId("bus-sighting-recent");
    expect(within(recent).getByText(/다로리 카페/)).toBeTruthy();
    expect(within(recent).getByText(/기록자 ID:/)).toBeTruthy();
  });
});
