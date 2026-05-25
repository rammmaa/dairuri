import { fireEvent, render, screen } from "@testing-library/react-native";

import { RouteMapPreview } from "../components/RouteMapPreview";
import type { BusRouteStop, BusStop } from "../types/domain";

const stops: BusStop[] = [
  { id: "stop-a", name: "Stop A", latitude: 35.6470, longitude: 128.7330 },
  { id: "stop-b", name: "Stop B", latitude: 35.6490, longitude: 128.7360 },
  { id: "stop-c", name: "Stop C", latitude: 35.6500, longitude: 128.7380 },
];

const links: BusRouteStop[] = [
  { routeId: "route-x", stopId: "stop-a", sequence: 1 },
  { routeId: "route-x", stopId: "stop-b", sequence: 2 },
  { routeId: "route-x", stopId: "stop-c", sequence: 3 },
  // belongs to a different route; should not appear
  { routeId: "route-y", stopId: "stop-a", sequence: 1 },
];

describe("RouteMapPreview", () => {
  it("renders the empty-state copy when no link matches the route", () => {
    render(
      <RouteMapPreview
        routeId="route-unknown"
        stops={stops}
        routeStops={links}
        width={300}
        height={150}
      />,
    );
    expect(screen.getByText("표시할 노선이 없어요")).toBeTruthy();
  });

  it("renders a touch overlay for each stop only when onPickStop is provided", () => {
    const { rerender } = render(
      <RouteMapPreview
        routeId="route-x"
        stops={stops}
        routeStops={links}
        width={300}
        height={150}
      />,
    );
    expect(screen.queryByTestId("route-map-pin-stop-a")).toBeNull();

    rerender(
      <RouteMapPreview
        routeId="route-x"
        stops={stops}
        routeStops={links}
        width={300}
        height={150}
        onPickStop={() => undefined}
      />,
    );
    expect(screen.getByTestId("route-map-pin-stop-a")).toBeTruthy();
    expect(screen.getByTestId("route-map-pin-stop-b")).toBeTruthy();
    expect(screen.getByTestId("route-map-pin-stop-c")).toBeTruthy();
  });

  it("forwards the picked stop id when an overlay is pressed", () => {
    const onPickStop = jest.fn();
    render(
      <RouteMapPreview
        routeId="route-x"
        stops={stops}
        routeStops={links}
        width={300}
        height={150}
        onPickStop={onPickStop}
      />,
    );
    fireEvent.press(screen.getByTestId("route-map-pin-stop-b"));
    expect(onPickStop).toHaveBeenCalledWith("stop-b");
  });

  it("renders the stop name labels when showLabels is true", () => {
    render(
      <RouteMapPreview
        routeId="route-x"
        stops={stops}
        routeStops={links}
        width={300}
        height={150}
        showLabels
      />,
    );
    expect(screen.getByText("Stop A")).toBeTruthy();
    expect(screen.getByText("Stop B")).toBeTruthy();
    expect(screen.getByText("Stop C")).toBeTruthy();
  });
});
