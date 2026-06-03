import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { AuthScreen } from "../screens/auth/AuthScreen";
import * as api from "../services/api";

jest.mock("../services/api", () => ({
  checkLoginIdAvailability: jest.fn(),
  confirmPhoneVerification: jest.fn(),
  login: jest.fn(),
  requestPhoneVerification: jest.fn(),
  signup: jest.fn(),
}));

describe("AuthScreen phone verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(api.checkLoginIdAvailability).mockResolvedValue({ available: true });
    jest.mocked(api.requestPhoneVerification).mockResolvedValue({
      verificationId: "phone-verification-1",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    jest.mocked(api.confirmPhoneVerification).mockResolvedValue({
      verificationId: "phone-verification-1",
      phone: "01012345678",
      verifiedToken: "verified-phone-token",
      verifiedAt: new Date().toISOString(),
    });
    jest.mocked(api.signup).mockResolvedValue({
      token: "session-token",
      user: {
        id: "user-1",
        loginId: "haram123",
        nickname: "이하람",
        realName: "이하람",
        phone: "01012345678",
        area: "다로리",
        temperature: 36.5,
        driverType: "nonDriver",
      },
    });
  });

  it("accepts a confirmed server-normalized phone when the input is formatted", async () => {
    const onComplete = jest.fn();
    render(<AuthScreen onComplete={onComplete} />);

    fireEvent.press(screen.getByTestId("auth-signup-link"));
    fireEvent.changeText(screen.getByTestId("signup-name-input"), "이하람");
    fireEvent.changeText(screen.getByTestId("signup-login-id-input"), "haram123");
    fireEvent.press(screen.getByTestId("signup-login-id-check"));
    await screen.findByText("사용 가능한 아이디입니다.");

    fireEvent.changeText(screen.getByTestId("signup-phone-input"), "01012345678");
    fireEvent.press(screen.getByTestId("signup-phone-request-code"));
    await screen.findByTestId("signup-phone-code-input");
    fireEvent.changeText(screen.getByTestId("signup-phone-code-input"), "123456");
    fireEvent.press(screen.getByTestId("signup-phone-confirm-code"));
    await screen.findByText("전화번호 인증 완료");

    fireEvent.changeText(screen.getByTestId("signup-password-input"), "password123");
    fireEvent.changeText(
      screen.getByTestId("signup-password-confirm-input"),
      "password123",
    );
    fireEvent.press(screen.getByText("비운전자"));
    fireEvent.press(screen.getByTestId("signup-next"));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
    expect(api.signup).toHaveBeenCalledWith(
      expect.objectContaining({
        phone: "01012345678",
        phoneVerification: {
          id: "phone-verification-1",
          token: "verified-phone-token",
        },
      }),
    );
  });
});
