import { StyleSheet } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";

import { AppButton } from "../components/AppButton";
import { Header } from "../components/Header";
import { TextInputField } from "../components/TextInputField";
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

    render(<Header title="프로필" titleSize="large" testID="profile-title-test-header" />);

    const largeHeaderTitle = screen.getByTestId("profile-title-test-header-title");
    expect(largeHeaderTitle.props.numberOfLines).toBe(1);
    expect(largeHeaderTitle.props.adjustsFontSizeToFit).toBe(false);

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

  it("caps shared button and input text scaling explicitly", () => {
    render(
      <>
        <AppButton label="채팅방으로 이동하기" />
        <TextInputField
          label="상세 설명"
          value=""
          onChangeText={() => undefined}
          testID="shared-text-input"
        />
      </>,
    );

    const buttonText = screen.getByText("채팅방으로 이동하기");
    expect(buttonText.props.numberOfLines).toBe(1);
    expect(buttonText.props.adjustsFontSizeToFit).toBe(true);
    expect(buttonText.props.maxFontSizeMultiplier).toBe(1.08);
    expect(screen.getByText("상세 설명").props.maxFontSizeMultiplier).toBe(1.08);
    expect(screen.getByTestId("shared-text-input").props.maxFontSizeMultiplier).toBe(
      1.08,
    );
  });
});
