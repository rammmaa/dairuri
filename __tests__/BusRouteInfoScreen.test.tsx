import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { BusRouteInfoScreen } from "../screens/BusRouteInfoScreen";

describe("BusRouteInfoScreen", () => {
  it("shows the route picker, defaults to H1, and renders its schedule + stops", async () => {
    render(<BusRouteInfoScreen />);

    await screen.findByTestId("route-info-chip-H1");
    for (const code of ["H1", "H2", "H3", "H4", "H5", "H6"]) {
      expect(screen.getByTestId(`route-info-chip-${code}`)).toBeTruthy();
    }

    // H1 schedule (real data) is shown by default. "첫차" is unique to the info
    // table (the map legend only has 기점 / 종점 / 다른 노선).
    expect(await screen.findByText("첫차")).toBeTruthy();
    expect(screen.getByText("07:50")).toBeTruthy(); // H1 first bus
    expect(screen.getByText("16:50")).toBeTruthy(); // H1 last bus
    expect(screen.getByText("청도버스")).toBeTruthy();
    // H1 stop sequence (9 stops) and its first/last stops.
    expect(screen.getByText("정류장 (9개)")).toBeTruthy();
    expect(screen.getAllByText("청도공용버스터미널").length).toBeGreaterThan(0);
  });

  it("switches the schedule when another route is picked", async () => {
    render(<BusRouteInfoScreen />);

    const h5 = await screen.findByTestId("route-info-chip-H5");
    await act(async () => {
      fireEvent.press(h5);
    });

    // H5 runs 동곡 -> 운문 삼계 with a 08:10 first bus.
    expect(await screen.findByText("08:10")).toBeTruthy();
    expect(screen.getAllByText(/삼계/).length).toBeGreaterThan(0);
    expect(screen.getByText("정류장 (6개)")).toBeTruthy();
  });
});
