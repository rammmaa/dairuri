import { fireEvent, render, screen } from "@testing-library/react-native";

import { RouteScreen } from "../screens/RouteScreen";

describe("RouteScreen sorting", () => {
  it("sorts route cards and filters route status chips", () => {
    render(<RouteScreen />);

    // Fastest route by default (durationMinutes ascending): H4 at 10 minutes.
    expect(screen.getByText("행복버스 4번 · 10분")).toBeTruthy();

    // Switching to departure-order surfaces H1 (06:10) as the first card.
    fireEvent.press(screen.getByTestId("route-sort-출발순"));
    expect(screen.getByText("행복버스 1번 · 12분")).toBeTruthy();

    // The express filter only matches H2 in the seed.
    fireEvent.press(screen.getByTestId("route-filter-급행"));
    expect(screen.getByText("1개 노선")).toBeTruthy();
    expect(screen.getByText("행복버스 2번")).toBeTruthy();

    // The 운행중 filter keeps H1, H3, and H6 in the seed.
    fireEvent.press(screen.getByTestId("route-filter-운행중"));
    expect(screen.getByTestId("route-filter-운행중").props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByText("3개 노선")).toBeTruthy();
    expect(screen.getByText("행복버스 1번")).toBeTruthy();
  });
});

describe("RouteScreen bus sighting entry", () => {
  it("renders the record-sighting button only when an onOpenBusSighting handler is supplied", () => {
    const { rerender } = render(<RouteScreen />);
    expect(screen.queryByTestId("route-record-sighting-button")).toBeNull();

    rerender(<RouteScreen onOpenBusSighting={() => undefined} />);
    expect(screen.getByTestId("route-record-sighting-button")).toBeTruthy();
  });

  it("calls onOpenBusSighting when the header button is pressed", () => {
    const handler = jest.fn();
    render(<RouteScreen onOpenBusSighting={handler} />);

    fireEvent.press(screen.getByTestId("route-record-sighting-button"));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("RouteScreen Phase 2 stub entry points", () => {
  it("hides the arrival-times and archive-history rows when handlers are not supplied", () => {
    render(<RouteScreen />);
    expect(screen.queryByTestId("route-open-arrival-times")).toBeNull();
    expect(screen.queryByTestId("route-open-archive-history")).toBeNull();
  });

  it("calls onOpenArrivalTimes when the matching row is pressed", () => {
    const handler = jest.fn();
    render(<RouteScreen onOpenArrivalTimes={handler} />);
    fireEvent.press(screen.getByTestId("route-open-arrival-times"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenArchiveHistory when the matching row is pressed", () => {
    const handler = jest.fn();
    render(<RouteScreen onOpenArchiveHistory={handler} />);
    fireEvent.press(screen.getByTestId("route-open-archive-history"));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
