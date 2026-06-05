import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { BusArchiveHistoryScreen } from "../screens/BusArchiveHistoryScreen";
import { resetMockDatabase } from "../services/mockDb";

describe("BusArchiveHistoryScreen", () => {
  beforeEach(() => {
    resetMockDatabase();
  });

  it("shows the six route cards", async () => {
    render(<BusArchiveHistoryScreen />);

    await screen.findByTestId("archive-route-card-H1");
    for (const code of ["H1", "H2", "H3", "H4", "H5", "H6"]) {
      expect(screen.getByTestId(`archive-route-card-${code}`)).toBeTruthy();
    }
  });

  it("opens a route's recorded sightings when its card is tapped", async () => {
    render(<BusArchiveHistoryScreen />);

    const card = await screen.findByTestId("archive-route-card-H1");
    await act(async () => {
      fireEvent.press(card);
    });

    // H1 has a seeded sighting (sighting-1 at the Cheongdo terminal).
    expect(await screen.findByTestId("archive-record-sighting-1")).toBeTruthy();
    expect(screen.getByText("행복버스 1번")).toBeTruthy();
    expect(screen.getAllByText("청도공용버스터미널").length).toBeGreaterThan(0);
  });

  it("shows an empty state for a route with no records, and back returns to the grid", async () => {
    const onBack = jest.fn();
    render(<BusArchiveHistoryScreen onBack={onBack} />);

    // H4 has no seeded sightings.
    const card = await screen.findByTestId("archive-route-card-H4");
    await act(async () => {
      fireEvent.press(card);
    });
    expect(await screen.findByTestId("archive-empty")).toBeTruthy();

    // Back goes to the grid first, then pops the screen.
    fireEvent.press(screen.getByLabelText("뒤로가기"));
    expect(await screen.findByTestId("archive-route-card-H1")).toBeTruthy();
    expect(onBack).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("뒤로가기"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
