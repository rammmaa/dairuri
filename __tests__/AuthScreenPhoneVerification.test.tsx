import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

import { AuthScreen } from "../screens/auth/AuthScreen";
import { colors } from "../constants/colors";
import * as ImagePicker from "expo-image-picker";
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

  it("shows unavailable login IDs and keeps signup blocked until a successful check", async () => {
    jest.mocked(api.checkLoginIdAvailability).mockResolvedValueOnce({
      available: false,
    });

    render(<AuthScreen onComplete={jest.fn()} />);

    fireEvent.press(screen.getByTestId("auth-signup-link"));
    fireEvent.changeText(screen.getByTestId("signup-name-input"), "이하람");
    fireEvent.changeText(screen.getByTestId("signup-login-id-input"), "test_user");
    fireEvent.press(screen.getByTestId("signup-login-id-check"));

    await screen.findByText("이미 사용 중인 아이디입니다.");
    expect(api.checkLoginIdAvailability).toHaveBeenCalledWith({
      loginId: "test_user",
    });

    fireEvent.press(screen.getByTestId("signup-next"));

    expect(screen.getByText("아이디 중복 확인을 완료해주세요.")).toBeTruthy();
    expect(api.signup).not.toHaveBeenCalled();
  });

  it("styles the login ID check action as a green button like phone verification", () => {
    render(<AuthScreen onComplete={jest.fn()} />);

    fireEvent.press(screen.getByTestId("auth-signup-link"));

    expect(
      StyleSheet.flatten(screen.getByTestId("signup-login-id-check").props.style)
        .backgroundColor,
    ).toBe(colors.mint);
    expect(
      StyleSheet.flatten(screen.getByTestId("signup-phone-request-code").props.style)
        .backgroundColor,
    ).toBe(colors.mint);
    expect(
      StyleSheet.flatten(screen.getByTestId("signup-login-id-check-text").props.style)
        .color,
    ).toBe(colors.surface);
  });

  it("requires a driver license photo before driver signup can continue", async () => {
    render(<AuthScreen onComplete={jest.fn()} />);

    await completeVerifiedSignupFields();

    fireEvent.press(screen.getByTestId("signup-next"));
    fireEvent.press(screen.getByText("허용"));

    expect(screen.getByText(/점선 내에 운전면허증이 보이도록/)).toBeTruthy();
    expect(screen.getByTestId("license-next").props.accessibilityState).toMatchObject({
      disabled: true,
    });

    fireEvent.press(screen.getByTestId("license-next"));

    expect(screen.queryByText("면허 정보")).toBeNull();
    expect(api.signup).not.toHaveBeenCalled();
  });

  it("captures a driver license photo without sending image bytes in the signup payload", async () => {
    const onComplete = jest.fn();
    jest.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValueOnce({
      granted: true,
    } as never);
    jest.mocked(ImagePicker.launchCameraAsync).mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file:///license.jpg",
          base64: "license-photo",
          mimeType: "image/jpeg",
        },
      ],
    } as never);

    render(<AuthScreen onComplete={onComplete} />);

    await completeVerifiedSignupFields();

    fireEvent.press(screen.getByTestId("signup-next"));
    fireEvent.press(screen.getByText("허용"));
    fireEvent.press(screen.getByTestId("license-capture-button"));

    await waitFor(() => {
      expect(screen.getByTestId("license-photo-preview").props.source).toEqual({
        uri: "file:///license.jpg",
      });
    });
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(
      expect.objectContaining({ base64: false }),
    );

    fireEvent.press(screen.getByTestId("license-next"));
    fireEvent.press(screen.getByTestId("driver-details-next"));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
    expect(api.signup).toHaveBeenCalledWith(
      expect.objectContaining({
        driverType: "driver",
        vehicle: expect.objectContaining({
          images: [],
        }),
      }),
    );
  });

  it("shows a Korean message when login credentials are invalid", async () => {
    jest.mocked(api.login).mockRejectedValueOnce(new Error("invalid credentials"));

    render(<AuthScreen onComplete={jest.fn()} />);

    fireEvent.changeText(screen.getByTestId("auth-login-id-input"), "rammma");
    fireEvent.changeText(screen.getByTestId("auth-login-password-input"), "wrongpass");
    fireEvent.press(screen.getByTestId("auth-login-next"));

    expect(
      await screen.findByText("아이디 또는 비밀번호를 확인해주세요."),
    ).toBeTruthy();
    expect(screen.queryByText("invalid credentials")).toBeNull();
  });
});

async function completeVerifiedSignupFields() {
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
}
