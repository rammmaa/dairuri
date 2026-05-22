import { fireEvent, render, screen } from "@testing-library/react-native";

import { RouteScreen } from "../screens/RouteScreen";

describe("RouteScreen sorting", () => {
  it("sorts route cards and filters route status chips", () => {
    render(<RouteScreen />);

    expect(screen.getByText("역 앞 셔틀 · 8분")).toBeTruthy();

    fireEvent.press(screen.getByTestId("route-sort-출발순"));
    expect(screen.getByText("다이루리 순환 · 12분")).toBeTruthy();

    fireEvent.press(screen.getByTestId("route-filter-급행"));
    expect(screen.getByText("1개 노선")).toBeTruthy();
    expect(screen.getByText("역 앞 셔틀")).toBeTruthy();

    fireEvent.press(screen.getByTestId("route-filter-운행중"));
    expect(screen.getByTestId("route-filter-운행중").props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByText("다이루리 순환")).toBeTruthy();
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
