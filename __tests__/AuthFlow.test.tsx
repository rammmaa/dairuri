import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import App from "../App";
import { typography } from "../constants/typography";

describe("Auth flow", () => {
  it("walks through signup, camera permission, manual license info, and enters the app", async () => {
    render(<App />);

    expect(await screen.findByText("아이디 / 전화번호")).toBeTruthy();
    expect(screen.queryByText("PASS 간편 로그인")).toBeNull();
    fireEvent.changeText(screen.getByTestId("auth-login-id-input"), "010 0000 0000");
    expect(screen.getByTestId("auth-login-id-input").props.value).toBe(
      "010-0000-0000",
    );
    expect(
      StyleSheet.flatten(screen.getByTestId("auth-login-next").props.style)
        .position,
    ).not.toBe("absolute");
    expect(screen.getByTestId("auth-login-password-input").props.secureTextEntry).toBe(
      true,
    );
    fireEvent.press(screen.getByTestId("auth-login-password-input-visibility-toggle"));
    expect(screen.getByTestId("auth-login-password-input").props.secureTextEntry).toBe(
      false,
    );

    fireEvent.press(screen.getByTestId("auth-signup-link"));
    expect(screen.getByText("성함")).toBeTruthy();
    const signupHeaderTitleStyle = StyleSheet.flatten(
      screen.getByTestId("auth-header-title").props.style,
    );
    expect(screen.getByTestId("auth-header-title").props.adjustsFontSizeToFit).toBe(
      false,
    );
    expect(screen.getByTestId("auth-header-title").props.maxFontSizeMultiplier).toBe(
      1,
    );
    expect(signupHeaderTitleStyle.fontSize).toBe(typography.size.base);
    expect(signupHeaderTitleStyle.lineHeight).toBe(20);
    expect(screen.getByText("운전자")).toBeTruthy();
    expect(screen.getByTestId("signup-login-id-input").props.placeholder).toBe(
      "아이디",
    );
    expect(screen.getByTestId("signup-login-id-input").props.keyboardType).toBe(
      "default",
    );
    expect(
      StyleSheet.flatten(screen.getByTestId("signup-next").props.style)
        .position,
    ).not.toBe("absolute");

    fireEvent.press(screen.getByTestId("signup-login-id-check"));
    expect(screen.getByText("아이디를 입력해주세요.")).toBeTruthy();
    fireEvent.changeText(screen.getByTestId("signup-login-id-input"), "haram123");
    fireEvent.press(screen.getByTestId("signup-login-id-check"));
    await waitFor(() => {
      expect(screen.getByText("사용 가능한 아이디입니다.")).toBeTruthy();
    });
    expect(screen.getByTestId("signup-login-id-check-text").props.numberOfLines).toBe(
      1,
    );
    expect(
      screen.getByTestId("signup-login-id-check-text").props.adjustsFontSizeToFit,
    ).toBe(true);

    fireEvent.changeText(screen.getByTestId("signup-phone-input"), "01012345678");
    expect(screen.getByTestId("signup-phone-input").props.value).toBe(
      "010-1234-5678",
    );
    expect(screen.getByTestId("signup-phone-input").props.maxFontSizeMultiplier).toBe(
      1.08,
    );
    expect(
      screen.getByTestId("signup-phone-request-code-text").props.numberOfLines,
    ).toBe(1);
    expect(
      screen.getByTestId("signup-phone-request-code-text").props.adjustsFontSizeToFit,
    ).toBe(true);
    expect(
      screen.getByTestId("signup-phone-request-code-text").props
        .maxFontSizeMultiplier,
    ).toBe(1.08);
    expect(screen.getByTestId("signup-password-input").props.secureTextEntry).toBe(
      true,
    );
    fireEvent.press(screen.getByTestId("signup-password-input-visibility-toggle"));
    expect(screen.getByTestId("signup-password-input").props.secureTextEntry).toBe(
      false,
    );
    expect(
      screen.getByTestId("signup-password-confirm-input").props.secureTextEntry,
    ).toBe(true);
    fireEvent.press(
      screen.getByTestId("signup-password-confirm-input-visibility-toggle"),
    );
    expect(
      screen.getByTestId("signup-password-confirm-input").props.secureTextEntry,
    ).toBe(false);

    fireEvent.press(screen.getByTestId("signup-next"));
    expect(screen.getByText("전화번호 인증을 완료해주세요.")).toBeTruthy();

    fireEvent.press(screen.getByTestId("signup-phone-request-code"));
    expect(await screen.findByTestId("signup-phone-code-input")).toBeTruthy();
    expect(screen.getByText("인증번호를 전송했어요.")).toBeTruthy();
    expect(
      screen.getByTestId("signup-phone-confirm-code-text").props.numberOfLines,
    ).toBe(1);
    expect(
      screen.getByTestId("signup-phone-confirm-code-text").props.adjustsFontSizeToFit,
    ).toBe(true);
    expect(
      screen.getByTestId("signup-phone-confirm-code-text").props
        .maxFontSizeMultiplier,
    ).toBe(1.08);
    fireEvent.press(screen.getByTestId("signup-phone-confirm-code"));
    await waitFor(() => {
      expect(screen.getByText("전화번호 인증 완료")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("signup-next"));
    expect(screen.getByText("카메라 액세스")).toBeTruthy();
    expect(screen.getByText(/운전 면허증 등록을 위해/)).toBeTruthy();

    fireEvent.press(screen.getByText("허용"));
    expect(screen.getByText(/점선 내에 운전면허증이 보이도록/)).toBeTruthy();

    fireEvent.press(screen.getByTestId("manual-license-link"));
    expect(screen.getByText("면허 정보")).toBeTruthy();
    expect(screen.getByText("차량 정보")).toBeTruthy();

    fireEvent.press(screen.getByTestId("driver-details-next"));
    await waitFor(() => {
      expect(screen.getByText("여기서 검색")).toBeTruthy();
    });
  });
});
