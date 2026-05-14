import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  BusFront,
  Camera,
  CarFront,
  ChevronLeft,
  Eye,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";

import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";

type AuthStep = "login" | "signup" | "license-camera" | "driver-details";
type SignupRole = "driver" | "rider";

export type AuthScreenProps = {
  onComplete: () => void;
};

export function AuthScreen({ onComplete }: AuthScreenProps) {
  const [step, setStep] = useState<AuthStep>("login");
  const [role, setRole] = useState<SignupRole>("driver");
  const [cameraModalVisible, setCameraModalVisible] = useState(false);

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
        onBack={() => setStep("license-camera")}
        onComplete={onComplete}
      />
    );
  }

  return (
    <SignupFormScreen
      role={role}
      cameraModalVisible={cameraModalVisible}
      onBack={() => setStep("login")}
      onRoleChange={setRole}
      onNext={() => {
        if (role === "driver") {
          setCameraModalVisible(true);
          return;
        }

        onComplete();
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

type LoginScreenProps = {
  onLogin: () => void;
  onSignup: () => void;
};

function LoginScreen({ onLogin, onSignup }: LoginScreenProps) {
  return (
    <View style={styles.authShell}>
      <View style={styles.logoMark} />

      <View style={styles.loginForm}>
        <AuthField label="ID / 전화번호" />
        <AuthField label="PASSWORD" secure />

        <View style={styles.loginLinks}>
          <Pressable style={styles.passLoginRow} accessibilityRole="button">
            <View style={styles.passIcon} />
            <Text style={styles.passLoginText}>PASS 간편 로그인</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            testID="auth-signup-link"
            onPress={onSignup}
          >
            <Text style={styles.signupLinkText}>회원가입</Text>
          </Pressable>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        testID="auth-login-next"
        style={({ pressed }) => [styles.bottomButton, pressed && styles.pressed]}
        onPress={onLogin}
      >
        <Text style={styles.bottomButtonText}>다음</Text>
      </Pressable>
    </View>
  );
}

type SignupFormScreenProps = {
  role: SignupRole;
  cameraModalVisible: boolean;
  onBack: () => void;
  onRoleChange: (role: SignupRole) => void;
  onNext: () => void;
  onAllowCamera: () => void;
  onDenyCamera: () => void;
};

function SignupFormScreen({
  role,
  cameraModalVisible,
  onBack,
  onRoleChange,
  onNext,
  onAllowCamera,
  onDenyCamera,
}: SignupFormScreenProps) {
  return (
    <View style={styles.authShell}>
      <AuthHeader title="회원가입" onBack={onBack} />

      <View style={styles.signupContent}>
        <AuthField label="성함" placeholder="010-0000-0000" />
        <View style={styles.fieldGroup}>
          <Text style={styles.formLabel}>아이디</Text>
          <View style={styles.inlineFieldRow}>
            <View style={[styles.inputBox, styles.emailInput]}>
              <Text style={styles.placeholder}>현재 이메일</Text>
            </View>
            <View style={[styles.inputBox, styles.checkInput]}>
              <Text style={styles.placeholder}>중복 확인</Text>
            </View>
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.formLabel}>비밀번호</Text>
          <View style={styles.inputBox} />
          <View style={styles.inputBox}>
            <Text style={styles.placeholder}>비밀번호 확인</Text>
          </View>
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
      </View>

      <Pressable
        accessibilityRole="button"
        testID="signup-next"
        style={({ pressed }) => [
          styles.bottomButton,
          styles.primaryBottomButton,
          pressed && styles.pressed,
        ]}
        onPress={onNext}
      >
        <Text style={styles.primaryBottomButtonText}>다음</Text>
      </Pressable>

      {cameraModalVisible ? (
        <CameraAccessModal onAllow={onAllowCamera} onDeny={onDenyCamera} />
      ) : null}
    </View>
  );
}

type LicenseCameraScreenProps = {
  onBack: () => void;
  onManual: () => void;
};

function LicenseCameraScreen({ onBack, onManual }: LicenseCameraScreenProps) {
  return (
    <View style={styles.authShell}>
      <AuthHeader title="회원가입" onBack={onBack} />
      <View style={styles.cameraContent}>
        <Text style={styles.cameraTitle}>
          점선 내에 운전면허증이 보이도록{"\n"}카메라를 옮겨주세요.
        </Text>
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
    </View>
  );
}

type DriverDetailsScreenProps = {
  onBack: () => void;
  onComplete: () => void;
};

function DriverDetailsScreen({ onBack, onComplete }: DriverDetailsScreenProps) {
  return (
    <View style={styles.authShell}>
      <AuthHeader title="회원가입" onBack={onBack} />
      <ScrollView
        style={styles.detailsScroll}
        contentContainerStyle={styles.detailsContent}
        showsVerticalScrollIndicator={false}
      >
        <AuthField label="성함" placeholder="010-0000-0000" />
        <View style={styles.fieldGroup}>
          <Text style={styles.formLabel}>아이디</Text>
          <View style={styles.inlineFieldRow}>
            <View style={[styles.inputBox, styles.emailInput]}>
              <Text style={styles.placeholder}>현재 이메일</Text>
            </View>
            <View style={[styles.inputBox, styles.checkInput]}>
              <Text style={styles.placeholder}>중복 확인</Text>
            </View>
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.formLabel}>비밀번호</Text>
          <View style={styles.inputBox} />
          <View style={styles.inputBox}>
            <Text style={styles.placeholder}>비밀번호 확인</Text>
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
          <View style={styles.vehicleInput}>
            <Text style={styles.placeholder}>123가 ****</Text>
            <Eye size={20} color={colors.gray300} strokeWidth={2.1} />
          </View>
          <Text style={styles.smallLabel}>차량 사진</Text>
          <View style={styles.carPhotoRow}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={styles.carPhoto}>
                <CarFront size={28} color={colors.slate} strokeWidth={2.2} />
              </View>
            ))}
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          testID="driver-details-next"
          style={({ pressed }) => [
            styles.detailsNextButton,
            pressed && styles.pressed,
          ]}
          onPress={onComplete}
        >
          <Text style={styles.primaryBottomButtonText}>다음</Text>
        </Pressable>
      </ScrollView>
    </View>
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
      <Text style={styles.authHeaderTitle}>{title}</Text>
    </View>
  );
}

type AuthFieldProps = {
  label: string;
  placeholder?: string;
  secure?: boolean;
};

function AuthField({ label, placeholder, secure = false }: AuthFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.formLabelMuted}>{label}</Text>
      <View style={styles.inputBox}>
        {placeholder ? <Text style={styles.placeholder}>{placeholder}</Text> : null}
        {secure ? <Eye size={20} color={colors.gray300} strokeWidth={2.1} /> : null}
      </View>
    </View>
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
        <Text style={styles.modalTitle}>카메라 액세스</Text>
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

const styles = StyleSheet.create({
  authShell: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  logoMark: {
    position: "absolute",
    top: 140,
    alignSelf: "center",
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 1.5,
    borderColor: colors.gray400,
  },
  loginForm: {
    position: "absolute",
    top: 377,
    left: 33,
    right: 33,
    gap: 17,
  },
  fieldGroup: {
    width: "100%",
    gap: 12,
  },
  formLabel: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: "500",
  },
  formLabelMuted: {
    color: colors.gray400,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: "500",
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
  placeholder: {
    color: colors.gray300,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: "500",
  },
  loginLinks: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  passLoginRow: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  passIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  passLoginText: {
    color: colors.red,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  signupLinkText: {
    color: colors.gray300,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: "500",
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
  bottomButtonText: {
    color: colors.gray400,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: "500",
  },
  primaryBottomButton: {
    backgroundColor: colors.mint,
  },
  primaryBottomButtonText: {
    color: colors.surface,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: "600",
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
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.regular,
  },
  signupContent: {
    paddingHorizontal: 27,
    paddingTop: 38,
    gap: 22,
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
    fontFamily: typography.family.body,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: "500",
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
  modalTitle: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
  },
  modalCopy: {
    marginTop: 24,
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: 24,
    fontWeight: "500",
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
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: "600",
  },
  modalDenyText: {
    color: colors.gray300,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: "600",
  },
  cameraContent: {
    paddingHorizontal: 20,
    paddingTop: 36,
    gap: 44,
  },
  cameraTitle: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "500",
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
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "right",
  },
  manualLink: {
    marginTop: 18,
    color: colors.gray300,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: "500",
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
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: "500",
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
