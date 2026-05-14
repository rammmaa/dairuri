import { fireEvent, render, screen } from "@testing-library/react-native";

import App from "../App";

describe("Recruitment creation flow", () => {
  it("opens the ride creation flow from the post tab and enters chat after publishing", async () => {
    render(<App />);

    fireEvent.press(await screen.findByTestId("auth-login-next"));
    fireEvent.press(screen.getByTestId("map-home-bottom-nav-posts"));

    expect(screen.getByText("어떤 모집을 시작할까요?")).toBeTruthy();
    const nextButton = screen.getByTestId("recruitment-next");
    expect(nextButton.props.accessibilityState).toMatchObject({
      disabled: true,
    });

    fireEvent.press(screen.getByTestId("recruitment-type-ride"));
    expect(screen.getByTestId("recruitment-next").props.accessibilityState).toMatchObject({
      disabled: false,
    });

    fireEvent.press(screen.getByTestId("recruitment-next"));
    expect(screen.getByText("어디로 떠나시나요?")).toBeTruthy();

    fireEvent.press(screen.getByTestId("place-field-departure"));
    expect(screen.getByText("지도에서 출발지 선택")).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText("장소 검색"), "청도");
    fireEvent.press(screen.getByTestId("place-result-cheongdo-station"));

    fireEvent.press(screen.getByTestId("place-field-destination"));
    expect(screen.getByText("지도에서 목적지 선택")).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText("장소 검색"), "대전");
    fireEvent.press(screen.getByTestId("place-result-daejeon-station"));

    expect(screen.getByText("청도역")).toBeTruthy();
    expect(screen.getByText("대전역")).toBeTruthy();
    fireEvent.press(screen.getByTestId("recruitment-next"));

    expect(screen.getByText("언제 출발하시나요?")).toBeTruthy();
    fireEvent.press(screen.getByText("화"));
    fireEvent.changeText(screen.getByPlaceholderText("출발 시간 입력"), "08:30");
    fireEvent.changeText(screen.getByPlaceholderText("카테고리 입력"), "출근");
    fireEvent.press(screen.getByTestId("recruitment-next"));

    expect(screen.getByText("모집글의 제목을 정해주세요.")).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText("제목 입력"), "청도에서 대전까지 같이 가요");
    fireEvent.changeText(screen.getByPlaceholderText("모집 인원 입력"), "3");
    fireEvent.press(screen.getByTestId("recruitment-next"));

    expect(screen.getByText("어떤 라이드를 원하시나요?")).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText("상세설명을 써주세요"), "매주 화요일 같이 출발할 분을 찾아요.");
    fireEvent.press(screen.getByLabelText("상호 채팅 동의"));
    fireEvent.press(screen.getByLabelText("서비스 이용약관"));
    fireEvent.press(screen.getByLabelText("개인정보 수집 및 이용 동의"));
    fireEvent.press(screen.getByLabelText("개인정보 제3자 제공 동의"));
    fireEvent.press(screen.getByTestId("recruitment-next"));

    expect(screen.getByText("마지막으로 확인해주세요.")).toBeTruthy();
    expect(screen.getByText("청도역 → 대전역")).toBeTruthy();

    fireEvent.press(screen.getByText("라이드 모집 시작하기"));
    expect(screen.getByText("지금 함께 이동할 대화를 확인하세요")).toBeTruthy();
    expect(screen.getByText("부릉팟")).toBeTruthy();
  });

  it("branches to the job flow and requires job-specific fields before the final check", async () => {
    render(<App />);

    fireEvent.press(await screen.findByTestId("auth-login-next"));
    fireEvent.press(screen.getByTestId("map-home-bottom-nav-posts"));
    fireEvent.press(screen.getByTestId("recruitment-type-work"));
    fireEvent.press(screen.getByTestId("recruitment-next"));

    expect(screen.getByText("어떤 파트너를 찾으시나요?")).toBeTruthy();
    expect(screen.getByTestId("recruitment-next").props.accessibilityState).toMatchObject({
      disabled: true,
    });

    fireEvent.changeText(screen.getByPlaceholderText("공고 제목 입력"), "다로리 카페 평일 근무");
    fireEvent.press(screen.getByText("유통/판매"));
    fireEvent.press(screen.getByTestId("recruitment-next"));

    expect(screen.getByText("근무 일정을 알려주세요.")).toBeTruthy();
    fireEvent.press(screen.getByText("화"));
    fireEvent.press(screen.getByText("목"));
    fireEvent.changeText(screen.getByPlaceholderText("시작 시간"), "09:00");
    fireEvent.changeText(screen.getByPlaceholderText("종료 시간"), "15:00");
    fireEvent.changeText(screen.getByPlaceholderText("급여"), "123123");
    fireEvent.press(screen.getByTestId("recruitment-next"));

    expect(screen.getByText("업무 상세 내용을 설명해주세요.")).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText("상세설명을 써주세요"), "카운터와 음료 제조를 도와주세요.");
    fireEvent.press(screen.getByLabelText("상호 채팅 동의"));
    fireEvent.press(screen.getByLabelText("서비스 이용약관"));
    fireEvent.press(screen.getByLabelText("개인정보 수집 및 이용 동의"));
    fireEvent.press(screen.getByLabelText("개인정보 제3자 제공 동의"));
    fireEvent.press(screen.getByTestId("recruitment-next"));

    expect(screen.getByText("마지막으로 확인해주세요.")).toBeTruthy();
    expect(screen.getByText("다로리 카페 평일 근무")).toBeTruthy();
    expect(screen.getByText("화 · 목")).toBeTruthy();
  });

  it("formats work time and pay fields while typing", async () => {
    render(<App />);

    fireEvent.press(await screen.findByTestId("auth-login-next"));
    fireEvent.press(screen.getByTestId("map-home-bottom-nav-posts"));
    fireEvent.press(screen.getByTestId("recruitment-type-work"));
    fireEvent.press(screen.getByTestId("recruitment-next"));
    fireEvent.changeText(screen.getByPlaceholderText("공고 제목 입력"), "다로리 카페 평일 근무");
    fireEvent.press(screen.getByText("유통/판매"));
    fireEvent.press(screen.getByTestId("recruitment-next"));

    const startTimeInput = screen.getByPlaceholderText("시작 시간");
    const endTimeInput = screen.getByPlaceholderText("종료 시간");

    fireEvent.changeText(startTimeInput, "2");
    expect(screen.getByPlaceholderText("시작 시간").props.value).toBe("2");
    fireEvent.changeText(screen.getByPlaceholderText("시작 시간"), "20");
    expect(screen.getByPlaceholderText("시작 시간").props.value).toBe("20");
    fireEvent.changeText(screen.getByPlaceholderText("시작 시간"), "200");
    expect(screen.getByPlaceholderText("시작 시간").props.value).toBe("200");
    fireEvent.changeText(screen.getByPlaceholderText("시작 시간"), "2000");
    expect(screen.getByPlaceholderText("시작 시간").props.value).toBe("20:00");

    fireEvent.changeText(endTimeInput, "930");
    expect(screen.getByPlaceholderText("종료 시간").props.value).toBe("930");
    fireEvent(screen.getByPlaceholderText("종료 시간"), "blur");
    fireEvent.changeText(screen.getByPlaceholderText("급여"), "123123");

    expect(screen.getByPlaceholderText("시작 시간").props.value).toBe("20:00");
    expect(screen.getByPlaceholderText("종료 시간").props.value).toBe("09:30");
    expect(screen.getByPlaceholderText("급여").props.value).toBe("123,123");
  });

  it("formats ride departure time while typing", async () => {
    render(<App />);

    fireEvent.press(await screen.findByTestId("auth-login-next"));
    fireEvent.press(screen.getByTestId("map-home-bottom-nav-posts"));
    fireEvent.press(screen.getByTestId("recruitment-type-ride"));
    fireEvent.press(screen.getByTestId("recruitment-next"));
    fireEvent.press(screen.getByTestId("place-field-departure"));
    fireEvent.press(screen.getByTestId("place-result-cheongdo-station"));
    fireEvent.press(screen.getByTestId("place-field-destination"));
    fireEvent.press(screen.getByTestId("place-result-daejeon-station"));
    fireEvent.press(screen.getByTestId("recruitment-next"));

    fireEvent.changeText(screen.getByPlaceholderText("출발 시간 입력"), "830");
    expect(screen.getByPlaceholderText("출발 시간 입력").props.value).toBe("830");
    fireEvent(screen.getByPlaceholderText("출발 시간 입력"), "blur");

    expect(screen.getByPlaceholderText("출발 시간 입력").props.value).toBe("08:30");
  });
});
