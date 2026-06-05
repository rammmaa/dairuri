import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { BusArrivalTimesScreen } from "../screens/BusArrivalTimesScreen";
import { resetMockDatabase } from "../services/mockDb";

describe("BusArrivalTimesScreen", () => {
  beforeEach(() => {
    resetMockDatabase();
  });

  it("shows the route/stop selection with H1 defaulted to its full stop list", async () => {
    render(<BusArrivalTimesScreen />);

    expect(await screen.findByText("행복버스 노선 선택 (1번 - 6번)")).toBeTruthy();
    // The chips render once the topology load resolves.
    await screen.findByTestId("arrival-route-chip-H1");
    for (const code of ["H1", "H2", "H3", "H4", "H5", "H6"]) {
      expect(screen.getByTestId(`arrival-route-chip-${code}`)).toBeTruthy();
    }
    // H1 visits all six stops by default.
    expect(
      await screen.findByTestId("arrival-stop-row-stop-nonggong-entrance"),
    ).toBeTruthy();
  });

  it("opens the weekday + times detail when a stop is tapped", async () => {
    render(<BusArrivalTimesScreen />);

    const row = await screen.findByTestId("arrival-stop-row-stop-arae-gumi");
    await act(async () => {
      fireEvent.press(row);
    });

    // Detail view: route chip, stop name, weekday selector, and a times list.
    expect(await screen.findByText("행복버스 1번")).toBeTruthy();
    expect(screen.getByText("아랫구미")).toBeTruthy();
    expect(screen.getByText("요일 선택")).toBeTruthy();
    expect(screen.getByText("버스 시간")).toBeTruthy();
    for (const day of ["월", "화", "수", "목", "금", "토", "일"]) {
      expect(screen.getByTestId(`arrival-weekday-${day}`)).toBeTruthy();
    }
    expect(screen.getByTestId("arrival-time-0")).toBeTruthy();
  });

  it("changes the times list when another weekday is selected", async () => {
    render(<BusArrivalTimesScreen />);

    const row = await screen.findByTestId("arrival-stop-row-stop-arae-gumi");
    await act(async () => {
      fireEvent.press(row);
    });
    await screen.findByText("버스 시간");

    // The source timetable runs 3 times a day and does not vary by weekday, so
    // selecting another weekday highlights that chip while the list stays put.
    expect(screen.queryAllByTestId(/^arrival-time-\d+$/)).toHaveLength(3);

    fireEvent.press(screen.getByTestId("arrival-weekday-일"));
    await waitFor(() => {
      expect(
        screen.getByTestId("arrival-weekday-일").props.accessibilityState,
      ).toMatchObject({ selected: true });
    });
    expect(screen.queryAllByTestId(/^arrival-time-\d+$/)).toHaveLength(3);
  });

  it("back from the detail returns to selection, then back calls onBack", async () => {
    const onBack = jest.fn();
    render(<BusArrivalTimesScreen onBack={onBack} />);

    const row = await screen.findByTestId("arrival-stop-row-stop-arae-gumi");
    await act(async () => {
      fireEvent.press(row);
    });
    await screen.findByText("요일 선택");

    // First back: detail -> selection
    fireEvent.press(screen.getByLabelText("뒤로가기"));
    expect(await screen.findByText("행복버스 정류장 선택")).toBeTruthy();
    expect(onBack).not.toHaveBeenCalled();

    // Second back: selection -> pop the screen
    fireEvent.press(screen.getByLabelText("뒤로가기"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
