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
import { getStopSightings } from "../services/api";
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

// Coordinates of 청도공용버스터미널 (id: stop-cheongdo-public-terminal).
// Inference picks the lowest-code route that visits this stop, which is H1.
const NEAREST_STOP_COORDS = { latitude: 35.6474, longitude: 128.7338 };

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

async function enterConfirmation() {
  await waitFor(() => {
    expect(
      screen.getByTestId("bus-sighting-record-button").props.accessibilityState,
    ).toMatchObject({ disabled: false });
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId("bus-sighting-record-button"));
  });
  expect(await screen.findByText("이 정류장이 맞나요?")).toBeTruthy();
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

    render(<BusSightingScreen />);

    await waitFor(() => {
      expect(
        screen.getByText(/위치 권한이 없으면 정류장을 자동으로 인식할 수 없어요/),
      ).toBeTruthy();
    });

    expect(
      screen.getByTestId("bus-sighting-record-button").props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("drops the live clock and surfaces the inferred stop on the recorder chip", async () => {
    grantPermissionWithLocation();

    render(<BusSightingScreen />);

    await waitFor(() => {
      expect(screen.getByText(/현위치: 청도공용버스터미널/)).toBeTruthy();
    });
    expect(screen.getByText("방금 버스 봤어요!")).toBeTruthy();
    // No live HH:MM:SS clock in the realigned recorder.
    expect(screen.queryByText(/^\d{2}:\d{2}:\d{2}$/)).toBeNull();
  });

  it("happy path: bus button -> confirmation -> 맞아요 -> confirmed modal", async () => {
    grantPermissionWithLocation();

    render(<BusSightingScreen />);
    await enterConfirmation();

    // Confirmation header title and the yellow route chip + stop name.
    expect(screen.getByText("정류장 매칭 확인")).toBeTruthy();
    expect(screen.getByText("행복버스 1번")).toBeTruthy();
    // Stop name appears in both the card and the map preview label.
    expect(screen.getAllByText("청도공용버스터미널").length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-accept-button"));
    });

    const modal = await screen.findByTestId("bus-sighting-confirmed-modal");
    expect(modal).toBeTruthy();
    expect(screen.getByText("기록 완료")).toBeTruthy();
    expect(screen.getByText(/확정이 되었습니다/)).toBeTruthy();
    expect(screen.getByTestId("confirmed-modal-home-button")).toBeTruthy();
    expect(screen.getByTestId("confirmed-modal-view-record-button")).toBeTruthy();
  });

  it("confirmed modal: 홈으로 calls onBack, 기록 보기 calls onOpenArchiveHistory", async () => {
    grantPermissionWithLocation();
    const onBack = jest.fn();
    const onOpenArchiveHistory = jest.fn();

    render(
      <BusSightingScreen
        onBack={onBack}
        onOpenArchiveHistory={onOpenArchiveHistory}
      />,
    );
    await enterConfirmation();
    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-accept-button"));
    });
    await screen.findByTestId("bus-sighting-confirmed-modal");

    fireEvent.press(screen.getByTestId("confirmed-modal-view-record-button"));
    expect(onOpenArchiveHistory).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByTestId("confirmed-modal-home-button"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("rejection path: 틀려요 -> selection (H1 default) -> stop tap -> 기록 확정 -> confirmed", async () => {
    grantPermissionWithLocation();

    render(<BusSightingScreen />);
    await enterConfirmation();

    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-reject-button"));
    });

    // Merged selection screen: header title, all six route chips, H1 selected
    // by default so the stop list is never empty.
    expect(await screen.findByText("노선/정류장 선택")).toBeTruthy();
    for (const code of ["H1", "H2", "H3", "H4", "H5", "H6"]) {
      expect(screen.getByTestId(`bus-sighting-route-chip-${code}`)).toBeTruthy();
    }
    expect(
      screen.getByTestId("bus-sighting-route-chip-H1").props.accessibilityState,
    ).toMatchObject({ selected: true });
    // H1 visits all six stops, so the full rail renders.
    expect(
      screen.getByTestId("bus-sighting-stop-row-stop-nonggong-entrance"),
    ).toBeTruthy();

    // Tap a stop -> the confirm-record modal asks to finalize.
    fireEvent.press(
      screen.getByTestId("bus-sighting-stop-row-stop-nonggong-entrance"),
    );
    const modal = await screen.findByTestId("bus-sighting-confirm-record-modal");
    // Scope to the modal: the stop name also appears in the rail row behind it.
    expect(within(modal).getByText("농공단지 입구")).toBeTruthy();
    expect(within(modal).getByText(/기록을 완료하시겠습니까/)).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId("confirm-record-confirm-button"));
    });

    expect(
      await screen.findByTestId("bus-sighting-confirmed-modal"),
    ).toBeTruthy();
  });

  it("switching a route chip updates the stop rail and the cancel button dismisses the modal", async () => {
    grantPermissionWithLocation();

    render(<BusSightingScreen />);
    await enterConfirmation();
    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-reject-button"));
    });
    await screen.findByText("노선/정류장 선택");

    // H2 visits only three stops (no 농공단지 입구).
    fireEvent.press(screen.getByTestId("bus-sighting-route-chip-H2"));
    await waitFor(() => {
      expect(
        screen.queryByTestId("bus-sighting-stop-row-stop-nonggong-entrance"),
      ).toBeNull();
    });
    expect(
      screen.getByTestId("bus-sighting-stop-row-stop-arae-gumi"),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("bus-sighting-stop-row-stop-arae-gumi"));
    expect(
      await screen.findByTestId("bus-sighting-confirm-record-modal"),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("confirm-record-cancel-button"));
    await waitFor(() => {
      expect(
        screen.queryByTestId("bus-sighting-confirm-record-modal"),
      ).toBeNull();
    });
  });

  it("renders the arrival-times entry only when onOpenArrivalTimes is provided and forwards taps", async () => {
    grantPermissionWithLocation();

    const { rerender } = render(<BusSightingScreen />);
    expect(screen.queryByTestId("bus-sighting-arrival-times-entry")).toBeNull();

    const onOpenArrivalTimes = jest.fn();
    rerender(<BusSightingScreen onOpenArrivalTimes={onOpenArrivalTimes} />);
    const entry = await screen.findByTestId("bus-sighting-arrival-times-entry");
    fireEvent.press(entry);
    expect(onOpenArrivalTimes).toHaveBeenCalledTimes(1);
  });

  it("renders the (i) header button only when onOpenRouteInfo is provided and forwards taps", async () => {
    grantPermissionWithLocation();

    const { rerender } = render(<BusSightingScreen />);
    expect(screen.queryByTestId("bus-sighting-info-button")).toBeNull();

    const onOpenRouteInfo = jest.fn();
    rerender(<BusSightingScreen onOpenRouteInfo={onOpenRouteInfo} />);
    const infoButton = screen.getByTestId("bus-sighting-info-button");
    fireEvent.press(infoButton);
    expect(onOpenRouteInfo).toHaveBeenCalledTimes(1);
  });

  it("commits the location frozen at bus-button press, not the latest watched location", async () => {
    // Arrive at 청도공용버스터미널, then drift to 구미리 (which has no seed
    // sighting). The recorded sighting must use the press-time coordinate, so
    // it lands on the terminal and never on 구미리.
    const terminal = { latitude: 35.6474, longitude: 128.7338 };
    const drift = { latitude: 35.6492, longitude: 128.7355 }; // 구미리

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
          latitude: terminal.latitude,
          longitude: terminal.longitude,
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

    render(<BusSightingScreen />);
    await enterConfirmation();
    expect(screen.getAllByText("청도공용버스터미널").length).toBeGreaterThan(0);

    // Drift while still on the confirmation screen; the frozen card keeps the
    // original stop name.
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
    expect(screen.getAllByText("청도공용버스터미널").length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-accept-button"));
    });
    await screen.findByTestId("bus-sighting-confirmed-modal");

    // The freeze worked if the new sighting landed on the terminal and 구미리
    // gained nothing despite being the post-drift nearest stop.
    const gumiriSightings = await getStopSightings("stop-gumiri");
    expect(gumiriSightings.length).toBe(0);
    const terminalSightings = await getStopSightings(
      "stop-cheongdo-public-terminal",
    );
    // One seed sighting plus the one we just recorded.
    expect(terminalSightings.length).toBeGreaterThanOrEqual(2);
  });

  it("back arrow walks the state machine in reverse", async () => {
    grantPermissionWithLocation();
    const onBack = jest.fn();

    render(<BusSightingScreen onBack={onBack} />);
    await enterConfirmation();

    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-reject-button"));
    });
    expect(await screen.findByText("노선/정류장 선택")).toBeTruthy();

    // First back: selection -> confirmation
    fireEvent.press(screen.getByLabelText("뒤로가기"));
    expect(await screen.findByText("이 정류장이 맞나요?")).toBeTruthy();

    // Second back: confirmation -> recorder
    fireEvent.press(screen.getByLabelText("뒤로가기"));
    await waitFor(() => {
      expect(screen.getByText("방금 버스 봤어요!")).toBeTruthy();
    });
    expect(onBack).not.toHaveBeenCalled();

    // Third back from recorder pops the screen.
    fireEvent.press(screen.getByLabelText("뒤로가기"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders the bottom nav on every state and forwards tab taps", async () => {
    grantPermissionWithLocation();
    const onSelectTab = jest.fn();

    render(<BusSightingScreen onSelectTab={onSelectTab} />);

    // Recorder
    expect(await screen.findByTestId("bus-sighting-bottom-nav")).toBeTruthy();

    await enterConfirmation();
    // Confirmation
    expect(screen.getByTestId("bus-sighting-bottom-nav")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId("bus-sighting-reject-button"));
    });
    await screen.findByText("노선/정류장 선택");
    // Selection
    expect(screen.getByTestId("bus-sighting-bottom-nav")).toBeTruthy();

    fireEvent.press(screen.getByTestId("bus-sighting-bottom-nav-map"));
    expect(onSelectTab).toHaveBeenCalledTimes(1);
    expect(onSelectTab).toHaveBeenCalledWith(
      expect.objectContaining({ id: "map" }),
    );
  });
});
