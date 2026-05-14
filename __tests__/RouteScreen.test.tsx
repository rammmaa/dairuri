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
