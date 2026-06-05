import { render, screen } from "@testing-library/react-native";

import { BusRouteInfoScreen } from "../screens/BusRouteInfoScreen";

describe("BusRouteInfoScreen", () => {
  it("renders the circular/one-way sections, schedule tables, and operator contacts", async () => {
    render(<BusRouteInfoScreen />);

    // Section headers for the circular route (H1) and the one-way routes.
    expect(await screen.findByText("순환선")).toBeTruthy();
    expect(screen.getByText("일방향선")).toBeTruthy();

    // H1 (circular) first departure and arrival times from the real timetable.
    expect(screen.getAllByText("07:50").length).toBeGreaterThan(0);
    expect(screen.getAllByText("17:10").length).toBeGreaterThan(0);
    // A one-way route (H2) round-trip time.
    expect(screen.getAllByText("18:40").length).toBeGreaterThan(0);

    // Every route's chip is present.
    for (const name of ["행복버스 1번", "행복버스 5번", "행복버스 6번"]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }

    // Operator contact numbers at the bottom.
    expect(screen.getByText(/054-371-5100/)).toBeTruthy();
    expect(screen.getByText(/053-743-4219/)).toBeTruthy();
  });
});
