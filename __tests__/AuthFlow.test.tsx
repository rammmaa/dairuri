import { fireEvent, render, screen } from "@testing-library/react-native";

import App from "../App";

describe("Auth flow", () => {
  it("walks through signup, camera permission, manual license info, and enters the app", async () => {
    render(<App />);

    expect(await screen.findByText("ID / 전화번호")).toBeTruthy();

    fireEvent.press(screen.getByTestId("auth-signup-link"));
    expect(screen.getByText("성함")).toBeTruthy();
    expect(screen.getByText("운전자")).toBeTruthy();

    fireEvent.press(screen.getByTestId("signup-next"));
    expect(screen.getByText("카메라 액세스")).toBeTruthy();
    expect(screen.getByText(/운전 면허증 등록을 위해/)).toBeTruthy();

    fireEvent.press(screen.getByText("허용"));
    expect(screen.getByText(/점선 내에 운전면허증이 보이도록/)).toBeTruthy();

    fireEvent.press(screen.getByTestId("manual-license-link"));
    expect(screen.getByText("면허 정보")).toBeTruthy();
    expect(screen.getByText("차량 정보")).toBeTruthy();

    fireEvent.press(screen.getByTestId("driver-details-next"));
    expect(screen.getByText("여기서 검색")).toBeTruthy();
  });
});
