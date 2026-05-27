import { fireEvent, render, screen } from "@testing-library/react-native";

import { ArchiveScreen } from "../screens/ArchiveScreen";

describe("ArchiveScreen filtering, sorting, and paging", () => {
  it("renders an empty-state message when no recruitment posts exist", () => {
    render(<ArchiveScreen initialPosts={[]} />);

    expect(screen.getByText("아직 등록된 모집글이 없어요")).toBeTruthy();
    expect(
      screen.getByText("새 모집글이 올라오면 여기에서 바로 확인할 수 있어요."),
    ).toBeTruthy();
  });

  it("filters recruitment cards, cycles sort order, and loads the next page", () => {
    render(<ArchiveScreen />);

    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("35분 전")).toBeTruthy();
    expect(screen.getByText("1시간 전")).toBeTruthy();
    expect(screen.getByText("2시간 전")).toBeTruthy();
    expect(screen.queryByText("4시간 전")).toBeNull();

    fireEvent.press(screen.getByTestId("archive-load-more"));

    expect(screen.getByText("4시간 전")).toBeTruthy();
    expect(screen.getByText("8시간 전")).toBeTruthy();
    expect(screen.queryByTestId("archive-load-more")).toBeNull();

    fireEvent.press(screen.getByTestId("archive-category-work"));

    expect(screen.getByTestId("archive-category-work").props.accessibilityState).toMatchObject({
      selected: true,
    });
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("1시간 전")).toBeTruthy();
    expect(screen.getByText("4시간 전")).toBeTruthy();
    expect(screen.queryByText("35분 전")).toBeNull();

    fireEvent.press(screen.getByTestId("archive-sort-filter"));

    expect(screen.getByText("오래된순")).toBeTruthy();
    expect(screen.getByText("4시간 전")).toBeTruthy();
  });

  it("applies date, time, and departure filters to archive cards", () => {
    render(<ArchiveScreen />);

    fireEvent.press(screen.getByTestId("archive-filter-날짜"));
    fireEvent.press(screen.getByTestId("archive-filter-시간"));
    fireEvent.press(screen.getByTestId("archive-filter-출발 장소"));

    expect(screen.getByText("오늘")).toBeTruthy();
    expect(screen.getByText("오후")).toBeTruthy();
    expect(screen.getAllByText("남성현역").length).toBeGreaterThan(0);
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("35분 전")).toBeTruthy();
    expect(screen.getByText("1시간 전")).toBeTruthy();
    expect(screen.queryByText("2시간 전")).toBeNull();
  });

  it("renders a filtered empty-state message when filters hide existing posts", () => {
    render(<ArchiveScreen />);

    fireEvent.press(screen.getByTestId("archive-category-ride"));
    fireEvent.press(screen.getByTestId("archive-filter-날짜"));
    fireEvent.press(screen.getByTestId("archive-filter-날짜"));
    fireEvent.press(screen.getByTestId("archive-filter-시간"));
    fireEvent.press(screen.getByTestId("archive-filter-시간"));

    expect(screen.getByText("조건에 맞는 모집글이 없어요")).toBeTruthy();
    expect(
      screen.getByText("필터를 바꾸거나 전체 모집글을 확인해보세요."),
    ).toBeTruthy();
  });
});
