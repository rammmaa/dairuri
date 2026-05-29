import { StyleSheet } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";

import { Header } from "../components/Header";
import { CreateRecruitmentScreen } from "../screens/CreateRecruitmentScreen";
import { searchPlaceCandidates } from "../services/places";

jest.mock("../services/places", () => ({
  searchPlaceCandidates: jest.fn(),
}));

const mockSearchPlaceCandidates = jest.mocked(searchPlaceCandidates);

describe("responsive text layout", () => {
  beforeEach(() => {
    mockSearchPlaceCandidates.mockResolvedValue([
      {
        id: "place-1",
        name: "청도역",
        address: "경북 청도군 청도읍 청화로",
        latitude: 35.6474,
        longitude: 128.7338,
        source: "api",
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("guards top and page titles against narrow-device clipping", () => {
    render(<Header title="매우 긴 상단 제목이 들어와도 잘리지 않아야 합니다" />);

    const headerTitle = screen.getByText("매우 긴 상단 제목이 들어와도 잘리지 않아야 합니다");
    expect(headerTitle.props.numberOfLines).toBe(1);
    expect(headerTitle.props.adjustsFontSizeToFit).toBe(true);
    expect(headerTitle.props.minimumFontScale).toBeLessThanOrEqual(0.82);

    render(<CreateRecruitmentScreen />);

    const pageTitle = screen.getByText("어떤 모집을 시작할까요?");
    expect(pageTitle.props.numberOfLines).toBe(2);
    expect(pageTitle.props.adjustsFontSizeToFit).toBe(true);
    expect(pageTitle.props.minimumFontScale).toBeLessThanOrEqual(0.82);

    const typeTitle = screen.getByText("정기 라이딩");
    expect(typeTitle.props.numberOfLines).toBe(1);
    expect(typeTitle.props.adjustsFontSizeToFit).toBe(true);
    expect(typeTitle.props.minimumFontScale).toBeLessThanOrEqual(0.82);
  });

  it("uses flexible weekday cells so seven days fit compact screens", async () => {
    render(<CreateRecruitmentScreen />);

    fireEvent.press(screen.getByTestId("recruitment-type-ride"));
    fireEvent.press(screen.getByTestId("recruitment-next"));

    fireEvent.press(screen.getByTestId("place-field-departure"));
    fireEvent.changeText(screen.getByPlaceholderText("장소 검색"), "청도");
    fireEvent.press(await screen.findByTestId("place-result-place-1"));

    fireEvent.press(screen.getByTestId("place-field-destination"));
    fireEvent.changeText(screen.getByPlaceholderText("장소 검색"), "청도");
    fireEvent.press(await screen.findByTestId("place-result-place-1"));

    fireEvent.press(screen.getByTestId("recruitment-next"));

    const mondayButton = screen.getByLabelText("월요일");
    const rawStyle =
      typeof mondayButton.props.style === "function"
        ? mondayButton.props.style({ pressed: false })
        : mondayButton.props.style;
    const style = StyleSheet.flatten(rawStyle);

    expect(style.width).toBeUndefined();
    expect(style.flex).toBe(1);
    expect(style.maxWidth).toBe(44);
    expect(style.aspectRatio).toBe(1);

    const mondayLabel = screen.getByText("월");
    expect(mondayLabel.props.numberOfLines).toBe(1);
    expect(mondayLabel.props.adjustsFontSizeToFit).toBe(true);
  });
});
