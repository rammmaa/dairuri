import type { ReactNode } from "react";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  BusFront,
  Camera,
  CarFront,
  ChevronLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";

import { ScreenTitle } from "../../components/ScreenTitle";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import {
  formatKoreanPhoneNumberInput,
  normalizeKoreanPhoneNumber,
} from "../../data/phoneNumberFormat";
import {
  checkLoginIdAvailability,
  confirmPhoneVerification,
  login,
  requestPhoneVerification,
  signup,
} from "../../services/api";
import type { SignupInput } from "../../types/domain";

type AuthStep = "login" | "signup" | "license-camera" | "driver-details";
type SignupRole = "driver" | "rider";

export type AuthScreenProps = {
  onComplete: () => void;
};

export function AuthScreen({ onComplete }: AuthScreenProps) {
  const [step, setStep] = useState<AuthStep>("login");
  const [role, setRole] = useState<SignupRole>("driver");
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [signupDraft, setSignupDraft] = useState<SignupDraft>(() => ({
    name: process.env.NODE_ENV === "test" ? "이하람" : "",
    phone: process.env.NODE_ENV === "test" ? "010-0000-0000" : "",
    loginId: "",
    password: process.env.NODE_ENV === "test" ? "password123" : "",
    passwordConfirm: process.env.NODE_ENV === "test" ? "password123" : "",
  }));
  const [loginIdCheck, setLoginIdCheck] = useState<LoginIdCheckDraft>({
    status: "idle",
  });
  const [phoneVerification, setPhoneVerification] = useState<PhoneVerificationDraft>({
    code: "",
    status: "idle",
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [phoneVerificationSubmitting, setPhoneVerificationSubmitting] = useState<
    "request" | "confirm" | null
  >(null);

  const submitSignup = async (vehicle?: SignupInput["vehicle"]) => {
    if (submitting) {
      return;
    }

    const validationError = validateSignupDraft(
      signupDraft,
      phoneVerification,
      loginIdCheck,
    );
    if (validationError) {
      setAuthError(validationError);
      return;
    }

    setSubmitting(true);
    setAuthError(null);
    try {
      await signup({
        loginId: signupDraft.loginId.trim(),
        nickname: signupDraft.name.trim(),
        realName: signupDraft.name.trim(),
        phone: normalizeKoreanPhoneNumber(signupDraft.phone),
        password: signupDraft.password,
        driverType: role === "driver" ? "driver" : "nonDriver",
        vehicle,
        phoneVerification: {
          id: phoneVerification.verificationId ?? "",
          token: phoneVerification.verifiedToken ?? "",
        },
      });
      onComplete();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "회원가입에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  const requestSignupLoginIdCheck = async () => {
    if (loginIdCheck.status === "checking") {
      return;
    }

    const loginId = signupDraft.loginId.trim();
    const validationError = validateLoginIdDraft(loginId);
    if (validationError) {
      setLoginIdCheck({ status: "invalid", message: validationError });
      setAuthError(null);
      return;
    }

    setLoginIdCheck({ status: "checking", checkedLoginId: loginId });
    setAuthError(null);
    try {
      const result = await checkLoginIdAvailability({ loginId });
      setLoginIdCheck({
        status: result.available ? "available" : "unavailable",
        checkedLoginId: loginId,
        message: result.available
          ? "사용 가능한 아이디입니다."
          : "이미 사용 중인 아이디입니다.",
      });
    } catch (error) {
      setLoginIdCheck({
        status: "invalid",
        checkedLoginId: loginId,
        message:
          error instanceof Error ? error.message : "아이디 확인에 실패했어요.",
      });
    }
  };

  const requestSignupPhoneVerification = async () => {
    if (phoneVerificationSubmitting) {
      return;
    }

    if (!signupDraft.phone.trim()) {
      setAuthError("전화번호를 입력해주세요.");
      return;
    }

    setPhoneVerificationSubmitting("request");
    setAuthError(null);
    try {
      const result = await requestPhoneVerification({
        phone: normalizeKoreanPhoneNumber(signupDraft.phone),
      });
      setPhoneVerification({
        code: result.debugCode ?? "",
        expiresAt: result.expiresAt,
        status: "requested",
        verificationId: result.verificationId,
      });
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "인증번호 요청에 실패했어요.",
      );
    } finally {
      setPhoneVerificationSubmitting(null);
    }
  };

  const confirmSignupPhoneVerification = async () => {
    if (phoneVerificationSubmitting) {
      return;
    }

    if (!phoneVerification.verificationId) {
      setAuthError("인증번호를 먼저 요청해주세요.");
      return;
    }

    if (!phoneVerification.code.trim()) {
      setAuthError("인증번호를 입력해주세요.");
      return;
    }

    setPhoneVerificationSubmitting("confirm");
    setAuthError(null);
    try {
      const result = await confirmPhoneVerification({
        verificationId: phoneVerification.verificationId,
        code: phoneVerification.code.trim(),
      });
      setPhoneVerification({
        ...phoneVerification,
        status: "verified",
        verifiedPhone: normalizeKoreanPhoneNumber(result.phone),
        verifiedToken: result.verifiedToken,
      });
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "전화번호 인증에 실패했어요.",
      );
    } finally {
      setPhoneVerificationSubmitting(null);
    }
  };

  if (step === "login") {
    return (
      <LoginScreen
        onLogin={onComplete}
        onSignup={() => setStep("signup")}
      />
    );
  }

  if (step === "license-camera") {
    return (
      <LicenseCameraScreen
        onBack={() => setStep("signup")}
        onManual={() => setStep("driver-details")}
      />
    );
  }

  if (step === "driver-details") {
    return (
      <DriverDetailsScreen
        draft={signupDraft}
        submitting={submitting}
        errorMessage={authError}
        onBack={() => setStep("license-camera")}
        onComplete={submitSignup}
      />
    );
  }

  return (
    <SignupFormScreen
      role={role}
      draft={signupDraft}
      phoneVerification={phoneVerification}
      loginIdCheck={loginIdCheck}
      phoneVerificationSubmitting={phoneVerificationSubmitting}
      cameraModalVisible={cameraModalVisible}
      submitting={submitting}
      errorMessage={authError}
      onBack={() => setStep("login")}
      onRoleChange={setRole}
      onDraftChange={(nextDraft) => {
        if (
          normalizeKoreanPhoneNumber(nextDraft.phone) !==
          normalizeKoreanPhoneNumber(signupDraft.phone)
        ) {
          setPhoneVerification({ code: "", status: "idle" });
        }
        if (nextDraft.loginId.trim() !== signupDraft.loginId.trim()) {
          setLoginIdCheck({ status: "idle" });
        }
        setSignupDraft(nextDraft);
        if (authError) {
          setAuthError(null);
        }
      }}
      onPhoneCodeChange={(code) =>
        setPhoneVerification((current) => ({ ...current, code }))
      }
      onCheckLoginId={requestSignupLoginIdCheck}
      onRequestPhoneCode={requestSignupPhoneVerification}
      onConfirmPhoneCode={confirmSignupPhoneVerification}
      onNext={() => {
        if (role === "driver") {
          const validationError = validateSignupDraft(
            signupDraft,
            phoneVerification,
            loginIdCheck,
          );
          if (validationError) {
            setAuthError(validationError);
            return;
          }
          setCameraModalVisible(true);
          return;
        }

        void submitSignup();
      }}
      onAllowCamera={() => {
        setCameraModalVisible(false);
        setStep("license-camera");
      }}
      onDenyCamera={() => {
        setCameraModalVisible(false);
        setStep("driver-details");
      }}
    />
  );
}

type SignupDraft = {
  name: string;
  phone: string;
  loginId: string;
  password: string;
  passwordConfirm: string;
};

type LoginIdCheckDraft = {
  status: "idle" | "checking" | "available" | "unavailable" | "invalid";
  checkedLoginId?: string;
  message?: string;
};

type PhoneVerificationDraft = {
  code: string;
  expiresAt?: string;
  status: "idle" | "requested" | "verified";
  verificationId?: string;
  verifiedPhone?: string;
  verifiedToken?: string;
};

type LoginScreenProps = {
  onLogin: () => void;
  onSignup: () => void;
};

function LoginScreen({ onLogin, onSignup }: LoginScreenProps) {
  const [identifier, setIdentifier] = useState(
    process.env.NODE_ENV === "test" ? "010-0000-0000" : "",
  );
  const [password, setPassword] = useState(
    process.env.NODE_ENV === "test" ? "password123" : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canSubmit = identifier.trim().length > 0 && password.trim().length > 0;

  const submitLogin = async () => {
    if (!canSubmit || submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await login({ identifier: identifier.trim(), password });
      onLogin();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로그인에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAwareAuthShell testID="login-keyboard-avoiding-view">
      <ScrollView
        style={styles.authScroll}
        contentContainerStyle={styles.loginContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoMark} />

        <View style={styles.loginForm}>
          <AuthField
            label="아이디 / 전화번호"
            value={identifier}
            onChangeText={(nextValue) => {
              setIdentifier(formatPhoneLikeIdentifierInput(nextValue));
              if (errorMessage) {
                setErrorMessage(null);
              }
            }}
            testID="auth-login-id-input"
          />
          <AuthField
            label="비밀번호"
            value={password}
            onChangeText={(nextValue) => {
              setPassword(nextValue);
              if (errorMessage) {
                setErrorMessage(null);
              }
            }}
            secure
            testID="auth-login-password-input"
          />

          <View style={styles.loginLinks}>
            <Pressable
              accessibilityRole="button"
              testID="auth-signup-link"
              onPress={onSignup}
            >
              <Text style={styles.signupLinkText}>회원가입</Text>
            </Pressable>
          </View>
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit || submitting }}
          testID="auth-login-next"
          disabled={!canSubmit || submitting}
          style={({ pressed }) => [
            styles.formSubmitButton,
            canSubmit && styles.primaryBottomButton,
            (!canSubmit || submitting) && styles.disabledButton,
            pressed && styles.pressed,
          ]}
          onPress={submitLogin}
        >
          <Text style={canSubmit ? styles.primaryBottomButtonText : styles.bottomButtonText}>
            {submitting ? "로그인 중" : "다음"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAwareAuthShell>
  );
}

type SignupFormScreenProps = {
  role: SignupRole;
  draft: SignupDraft;
  phoneVerification: PhoneVerificationDraft;
  loginIdCheck: LoginIdCheckDraft;
  phoneVerificationSubmitting: "request" | "confirm" | null;
  cameraModalVisible: boolean;
  submitting: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onRoleChange: (role: SignupRole) => void;
  onDraftChange: (draft: SignupDraft) => void;
  onPhoneCodeChange: (code: string) => void;
  onCheckLoginId: () => void;
  onRequestPhoneCode: () => void;
  onConfirmPhoneCode: () => void;
  onNext: () => void;
  onAllowCamera: () => void;
  onDenyCamera: () => void;
};

function SignupFormScreen({
  role,
  draft,
  phoneVerification,
  loginIdCheck,
  phoneVerificationSubmitting,
  cameraModalVisible,
  submitting,
  errorMessage,
  onBack,
  onRoleChange,
  onDraftChange,
  onPhoneCodeChange,
  onCheckLoginId,
  onRequestPhoneCode,
  onConfirmPhoneCode,
  onNext,
  onAllowCamera,
  onDenyCamera,
}: SignupFormScreenProps) {
  const updateDraft = (key: keyof SignupDraft, value: string) => {
    onDraftChange({
      ...draft,
      [key]: key === "phone" ? formatKoreanPhoneNumberInput(value) : value,
    });
  };

  return (
    <KeyboardAwareAuthShell testID="signup-keyboard-avoiding-view">
      <AuthHeader title="회원가입" onBack={onBack} />

      <ScrollView
        style={styles.signupScroll}
        contentContainerStyle={styles.signupContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthField
          label="성함"
          placeholder="홍길동"
          value={draft.name}
          onChangeText={(value) => updateDraft("name", value)}
          testID="signup-name-input"
        />
        <View style={styles.fieldGroup}>
          <Text style={styles.formLabel}>아이디</Text>
          <View style={styles.inlineFieldRow}>
            <TextInput
              value={draft.loginId}
              onChangeText={(value) => updateDraft("loginId", value)}
              placeholder="아이디"
              placeholderTextColor={colors.gray300}
              keyboardType="default"
              autoCapitalize="none"
              testID="signup-login-id-input"
              style={[styles.inputBox, styles.emailInput, styles.textInput]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: loginIdCheck.status === "checking" }}
              disabled={loginIdCheck.status === "checking"}
              onPress={onCheckLoginId}
              testID="signup-login-id-check"
              style={({ pressed }) => [
                styles.inputBox,
                styles.checkInput,
                loginIdCheck.status === "available" && styles.verifiedButton,
                loginIdCheck.status === "checking" && styles.disabledButton,
                pressed && styles.pressed,
              ]}
            >
              <Text
                testID="signup-login-id-check-text"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                style={[
                  styles.placeholder,
                  loginIdCheck.status === "available" && styles.checkInputTextVerified,
                ]}
              >
                {loginIdCheck.status === "checking" ? "확인 중" : "확인"}
              </Text>
            </Pressable>
          </View>
          {loginIdCheck.message ? (
            <Text
              style={[
                styles.verificationStatusText,
                loginIdCheck.status !== "available" && styles.errorText,
              ]}
            >
              {loginIdCheck.message}
            </Text>
          ) : null}
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.formLabel}>전화번호</Text>
          <View style={styles.inlineFieldRow}>
            <TextInput
              value={draft.phone}
              onChangeText={(value) => updateDraft("phone", value)}
              placeholder="010-0000-0000"
              placeholderTextColor={colors.gray300}
              keyboardType="phone-pad"
              testID="signup-phone-input"
              style={[styles.inputBox, styles.phoneInput, styles.textInput]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled: phoneVerificationSubmitting === "request",
              }}
              disabled={phoneVerificationSubmitting === "request"}
              testID="signup-phone-request-code"
              style={({ pressed }) => [
                styles.verificationButton,
                phoneVerification.status === "verified" && styles.verifiedButton,
                phoneVerificationSubmitting === "request" && styles.disabledButton,
                pressed && styles.pressed,
              ]}
              onPress={onRequestPhoneCode}
            >
              <Text
                testID="signup-phone-request-code-text"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
                style={styles.verificationButtonText}
              >
                {phoneVerification.status === "verified"
                  ? "완료"
                  : phoneVerificationSubmitting === "request"
                    ? "요청 중"
                    : "인증"}
              </Text>
            </Pressable>
          </View>
          {phoneVerification.status !== "idle" ? (
            <View style={styles.inlineFieldRow}>
              <TextInput
                value={phoneVerification.code}
                onChangeText={onPhoneCodeChange}
                placeholder="인증번호 6자리"
                placeholderTextColor={colors.gray300}
                keyboardType="phone-pad"
                testID="signup-phone-code-input"
                style={[styles.inputBox, styles.phoneInput, styles.textInput]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityState={{
                  disabled:
                    phoneVerification.status === "verified" ||
                    phoneVerificationSubmitting === "confirm",
                }}
                disabled={
                  phoneVerification.status === "verified" ||
                  phoneVerificationSubmitting === "confirm"
                }
                testID="signup-phone-confirm-code"
                style={({ pressed }) => [
                  styles.verificationButton,
                  phoneVerification.status === "verified" && styles.verifiedButton,
                  phoneVerificationSubmitting === "confirm" && styles.disabledButton,
                  pressed && styles.pressed,
                ]}
                onPress={onConfirmPhoneCode}
              >
                <Text
                  testID="signup-phone-confirm-code-text"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                  style={styles.verificationButtonText}
                >
                  {phoneVerificationSubmitting === "confirm" ? "확인 중" : "확인"}
                </Text>
              </Pressable>
            </View>
          ) : null}
          {phoneVerification.status === "verified" ? (
            <Text style={styles.verificationStatusText}>전화번호 인증 완료</Text>
          ) : phoneVerification.status === "requested" ? (
            <Text style={styles.verificationStatusText}>인증번호를 전송했어요.</Text>
          ) : null}
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.formLabel}>비밀번호</Text>
          <SecureTextInputBox
            value={draft.password}
            onChangeText={(value) => updateDraft("password", value)}
            placeholder="8자 이상"
            testID="signup-password-input"
          />
          <SecureTextInputBox
            value={draft.passwordConfirm}
            onChangeText={(value) => updateDraft("passwordConfirm", value)}
            placeholder="비밀번호 확인"
            testID="signup-password-confirm-input"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.formLabel}>해당</Text>
          <View style={styles.roleRow}>
            <RoleOption
              label="운전자"
              selected={role === "driver"}
              tone="mint"
              icon="car"
              onPress={() => onRoleChange("driver")}
            />
            <RoleOption
              label="비운전자"
              selected={role === "rider"}
              tone="yellow"
              icon="person"
              onPress={() => onRoleChange("rider")}
            />
          </View>
        </View>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <Pressable
          accessibilityRole="button"
          testID="signup-next"
          style={({ pressed }) => [
            styles.formSubmitButton,
            styles.primaryBottomButton,
            pressed && styles.pressed,
          ]}
          disabled={submitting}
          onPress={onNext}
        >
          <Text style={styles.primaryBottomButtonText}>
            {submitting ? "처리 중" : "다음"}
          </Text>
        </Pressable>
      </ScrollView>

      {cameraModalVisible ? (
        <CameraAccessModal onAllow={onAllowCamera} onDeny={onDenyCamera} />
      ) : null}
    </KeyboardAwareAuthShell>
  );
}

type LicenseCameraScreenProps = {
  onBack: () => void;
  onManual: () => void;
};

function LicenseCameraScreen({ onBack, onManual }: LicenseCameraScreenProps) {
  return (
    <KeyboardAwareAuthShell>
      <AuthHeader title="회원가입" onBack={onBack} />
      <View style={styles.cameraContent}>
        <ScreenTitle>
          점선 내에 운전면허증이 보이도록{"\n"}카메라를 옮겨주세요.
        </ScreenTitle>
        <View style={styles.licenseFrame} />
        <Text style={styles.cameraHint}>
          빛 반사가 생기면 인식이 어려워요!{"\n"}평지에 놓고 찍는 것을 권장드려요.
        </Text>
        <Pressable
          accessibilityRole="button"
          testID="manual-license-link"
          onPress={onManual}
        >
          <Text style={styles.manualLink}>수동으로 정보 입력하기</Text>
        </Pressable>
      </View>
    </KeyboardAwareAuthShell>
  );
}

type DriverDetailsScreenProps = {
  draft: SignupDraft;
  submitting: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onComplete: (vehicle: SignupInput["vehicle"]) => void;
};

function DriverDetailsScreen({
  draft,
  submitting,
  errorMessage,
  onBack,
  onComplete,
}: DriverDetailsScreenProps) {
  const [plateNumber, setPlateNumber] = useState(
    process.env.NODE_ENV === "test" ? "123가 5678" : "",
  );
  const [modelName, setModelName] = useState(
    process.env.NODE_ENV === "test" ? "다로리 카" : "",
  );
  const vehicleReady = plateNumber.trim().length > 0;

  return (
    <KeyboardAwareAuthShell testID="driver-details-keyboard-avoiding-view">
      <AuthHeader title="회원가입" onBack={onBack} />
      <ScrollView
        style={styles.detailsScroll}
        contentContainerStyle={styles.detailsContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthField
          label="성함"
          value={draft.name}
          onChangeText={() => undefined}
          editable={false}
        />
        <View style={styles.fieldGroup}>
          <Text style={styles.formLabel}>아이디</Text>
          <View style={styles.inlineFieldRow}>
            <View style={[styles.inputBox, styles.emailInput]}>
              <Text style={styles.valueText}>{draft.loginId || "아이디 없음"}</Text>
            </View>
            <View style={[styles.inputBox, styles.checkInput]}>
              <Text style={styles.placeholder}>확인</Text>
            </View>
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.formLabel}>비밀번호</Text>
          <View style={styles.inputBox}>
            <Text style={styles.valueText}>********</Text>
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.formLabel}>해당</Text>
          <View style={styles.roleRow}>
            <RoleOption label="운전자" selected tone="mint" icon="car" />
            <RoleOption label="비운전자" tone="yellow" icon="person" />
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.formLabel}>면허 정보</Text>
          <View style={styles.licenseInfoBox} />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.formLabel}>차량 정보</Text>
          <Text style={styles.smallLabel}>차량 번호</Text>
          <TextInput
            value={plateNumber}
            onChangeText={setPlateNumber}
            placeholder="123가 5678"
            placeholderTextColor={colors.gray300}
            testID="driver-plate-input"
            style={[styles.vehicleInput, styles.textInput]}
          />
          <Text style={styles.smallLabel}>차종</Text>
          <TextInput
            value={modelName}
            onChangeText={setModelName}
            placeholder="차종 입력"
            placeholderTextColor={colors.gray300}
            testID="driver-model-input"
            style={[styles.vehicleInput, styles.textInput]}
          />
          <Text style={styles.smallLabel}>차량 사진</Text>
          <View style={styles.carPhotoRow}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={styles.carPhoto}>
                <CarFront size={28} color={colors.slate} strokeWidth={2.2} />
              </View>
            ))}
          </View>
        </View>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !vehicleReady || submitting }}
          testID="driver-details-next"
          disabled={!vehicleReady || submitting}
          style={({ pressed }) => [
            styles.detailsNextButton,
            (!vehicleReady || submitting) && styles.disabledButton,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            onComplete({
              plateNumber: plateNumber.trim(),
              modelName: modelName.trim() || undefined,
              images: [],
            })
          }
        >
          <Text style={styles.primaryBottomButtonText}>
            {submitting ? "가입 중" : "다음"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAwareAuthShell>
  );
}

function KeyboardAwareAuthShell({
  children,
  testID,
}: {
  children: ReactNode;
  testID?: string;
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
      style={styles.authShell}
      testID={testID}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

type AuthHeaderProps = {
  title: string;
  onBack: () => void;
};

function AuthHeader({ title, onBack }: AuthHeaderProps) {
  return (
    <View style={styles.authHeader}>
      <Pressable accessibilityRole="button" onPress={onBack}>
        <ChevronLeft size={20} color={colors.black} strokeWidth={2.3} />
      </Pressable>
      <ScreenTitle style={styles.authHeaderTitle} numberOfLines={1}>
        {title}
      </ScreenTitle>
    </View>
  );
}

type AuthFieldProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  secure?: boolean;
  editable?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad";
  testID?: string;
};

function AuthField({
  label,
  placeholder,
  value,
  onChangeText,
  secure = false,
  editable = true,
  keyboardType = "default",
  testID,
}: AuthFieldProps) {
  const [visible, setVisible] = useState(false);
  const secureTextEntry = secure && !visible;

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={styles.inputBox}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray300}
          secureTextEntry={secureTextEntry}
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize="none"
          testID={testID}
          style={styles.authTextInput}
        />
        {secure ? (
          <PasswordVisibilityButton
            visible={visible}
            onPress={() => setVisible((current) => !current)}
            testID={testID ? `${testID}-visibility-toggle` : undefined}
          />
        ) : null}
      </View>
    </View>
  );
}

type SecureTextInputBoxProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  testID: string;
};

function SecureTextInputBox({
  value,
  onChangeText,
  placeholder,
  testID,
}: SecureTextInputBoxProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.inputBox}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        placeholder={placeholder}
        placeholderTextColor={colors.gray300}
        autoCapitalize="none"
        testID={testID}
        style={styles.authTextInput}
      />
      <PasswordVisibilityButton
        visible={visible}
        onPress={() => setVisible((current) => !current)}
        testID={`${testID}-visibility-toggle`}
      />
    </View>
  );
}

type PasswordVisibilityButtonProps = {
  visible: boolean;
  onPress: () => void;
  testID?: string;
};

function PasswordVisibilityButton({
  visible,
  onPress,
  testID,
}: PasswordVisibilityButtonProps) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
      hitSlop={8}
      testID={testID}
      onPress={onPress}
    >
      <Icon size={20} color={colors.gray300} strokeWidth={2.1} />
    </Pressable>
  );
}

type RoleOptionProps = {
  label: string;
  selected?: boolean;
  tone: "mint" | "yellow";
  icon: "car" | "person";
  onPress?: () => void;
};

function RoleOption({
  label,
  selected = false,
  tone,
  icon,
  onPress,
}: RoleOptionProps) {
  const accent = tone === "mint" ? colors.mint : colors.yellow;
  const selectedBackground = tone === "mint" ? colors.mintLight : colors.yellowLight;
  const Icon = icon === "car" ? BusFront : UserRound;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.roleOption,
        selected && {
          borderColor: accent,
          backgroundColor: selectedBackground,
        },
        pressed && styles.pressed,
      ]}
    >
      <Icon size={16} color={accent} strokeWidth={2.3} />
      <Text style={styles.roleLabel}>{label}</Text>
    </Pressable>
  );
}

type CameraAccessModalProps = {
  onAllow: () => void;
  onDeny: () => void;
};

function CameraAccessModal({ onAllow, onDeny }: CameraAccessModalProps) {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.cameraModal}>
        <View style={styles.cameraIconFrame}>
          <Camera size={26} color={colors.mint} strokeWidth={2.4} />
        </View>
        <ScreenTitle>카메라 액세스</ScreenTitle>
        <Text style={styles.modalCopy}>
          운전 면허증 등록을 위해{"\n"}액세스를 요청합니다.
        </Text>
        <View style={styles.modalActionRow}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.modalAllowButton,
              pressed && styles.pressed,
            ]}
            onPress={onAllow}
          >
            <Text style={styles.modalAllowText}>허용</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.modalDenyButton,
              pressed && styles.pressed,
            ]}
            onPress={onDeny}
          >
            <Text style={styles.modalDenyText}>미허용</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function validateSignupDraft(
  draft: SignupDraft,
  phoneVerification?: PhoneVerificationDraft,
  loginIdCheck?: LoginIdCheckDraft,
) {
  if (!draft.name.trim()) {
    return "성함을 입력해주세요.";
  }

  const loginIdError = validateLoginIdDraft(draft.loginId.trim());
  if (loginIdError) {
    return loginIdError;
  }

  if (
    loginIdCheck?.status !== "available" ||
    loginIdCheck.checkedLoginId !== draft.loginId.trim()
  ) {
    return "아이디 중복 확인을 완료해주세요.";
  }

  const normalizedPhone = normalizeKoreanPhoneNumber(draft.phone);

  if (!normalizedPhone) {
    return "전화번호를 입력해주세요.";
  }

  if (draft.password.length < 8) {
    return "비밀번호는 8자 이상이어야 해요.";
  }

  if (draft.password !== draft.passwordConfirm) {
    return "비밀번호 확인이 일치하지 않아요.";
  }

  if (
    !phoneVerification?.verifiedToken ||
    normalizeKoreanPhoneNumber(phoneVerification.verifiedPhone ?? "") !==
      normalizedPhone
  ) {
    return "전화번호 인증을 완료해주세요.";
  }

  return null;
}

function validateLoginIdDraft(loginId: string) {
  if (!loginId) {
    return "아이디를 입력해주세요.";
  }

  if (!/^[A-Za-z0-9_]{4,20}$/.test(loginId)) {
    return "아이디는 영문, 숫자, 밑줄 4~20자로 입력해주세요.";
  }

  return null;
}

function formatPhoneLikeIdentifierInput(value: string) {
  if (!value || !/^[\d\s-]+$/.test(value)) {
    return value;
  }

  return formatKoreanPhoneNumberInput(value);
}

const styles = StyleSheet.create({
  authShell: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  authScroll: {
    flex: 1,
  },
  logoMark: {
    alignSelf: "center",
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 1.5,
    borderColor: colors.gray400,
  },
  loginForm: {
    width: "100%",
    gap: 17,
  },
  loginContent: {
    minHeight: "100%",
    paddingHorizontal: 33,
    paddingTop: 140,
    paddingBottom: 36,
    justifyContent: "center",
    gap: 80,
  },
  fieldGroup: {
    width: "100%",
    gap: 12,
  },
  formLabel: {
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  formLabelMuted: {
    color: colors.gray400,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  inputBox: {
    minHeight: 64,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  disabledButton: {
    opacity: 0.62,
  },
  textInput: {
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  authTextInput: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 0,
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  valueText: {
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  placeholder: {
    color: colors.gray300,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  checkInputTextVerified: {
    color: colors.surface,
    fontFamily: typography.family.semibold,
  },
  errorText: {
    color: colors.red,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  loginLinks: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  signupLinkText: {
    color: colors.gray300,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    textDecorationLine: "underline",
  },
  bottomButton: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 67,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  formSubmitButton: {
    width: "100%",
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomButtonText: {
    color: colors.gray400,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  primaryBottomButton: {
    backgroundColor: colors.mint,
  },
  primaryBottomButtonText: {
    color: colors.surface,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  authHeader: {
    height: 80,
    paddingLeft: 27,
    paddingTop: 47,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  authHeaderTitle: {
    flex: 1,
    minWidth: 0,
  },
  signupContent: {
    paddingHorizontal: 27,
    paddingTop: 38,
    paddingBottom: 36,
    gap: 22,
  },
  signupScroll: {
    flex: 1,
  },
  inlineFieldRow: {
    flexDirection: "row",
    gap: 6,
  },
  emailInput: {
    flex: 1,
  },
  checkInput: {
    width: 108,
    alignItems: "center",
    justifyContent: "center",
  },
  phoneInput: {
    flex: 1,
  },
  verificationButton: {
    width: 108,
    minHeight: 64,
    borderRadius: 12,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedButton: {
    backgroundColor: colors.slate,
  },
  verificationButtonText: {
    color: colors.surface,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  verificationStatusText: {
    color: colors.mint,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  roleOption: {
    flex: 1,
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  roleLabel: {
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  cameraModal: {
    width: "100%",
    maxWidth: 360,
    minHeight: 260,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 24,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  cameraIconFrame: {
    position: "absolute",
    top: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCopy: {
    marginTop: 24,
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: 24,
    textAlign: "center",
  },
  modalActionRow: {
    width: "100%",
    marginTop: 48,
    flexDirection: "row",
    gap: 16,
  },
  modalAllowButton: {
    flex: 1,
    height: 36,
    borderRadius: 5,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDenyButton: {
    flex: 1,
    height: 36,
    borderRadius: 5,
    backgroundColor: colors.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAllowText: {
    color: colors.surface,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  modalDenyText: {
    color: colors.gray300,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  cameraContent: {
    paddingHorizontal: 20,
    paddingTop: 36,
    gap: 44,
  },
  licenseFrame: {
    height: 176,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.gray400,
  },
  cameraHint: {
    color: colors.gray400,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: 20,
    textAlign: "right",
  },
  manualLink: {
    marginTop: 18,
    color: colors.gray300,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    textAlign: "center",
    textDecorationLine: "underline",
  },
  detailsScroll: {
    flex: 1,
  },
  detailsContent: {
    paddingHorizontal: 27,
    paddingTop: 38,
    paddingBottom: 32,
    gap: 20,
  },
  licenseInfoBox: {
    height: 96,
    borderRadius: 12,
    backgroundColor: colors.gray50,
  },
  smallLabel: {
    marginLeft: 6,
    color: colors.gray400,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  vehicleInput: {
    minHeight: 64,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  carPhotoRow: {
    flexDirection: "row",
    gap: 6,
  },
  carPhoto: {
    flex: 1,
    height: 77,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsNextButton: {
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.82,
  },
});
