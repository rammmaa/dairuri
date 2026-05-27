import { ChevronRight, EyeOff, LockKeyhole, Scissors } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { ReactNode } from "react";

import { AppButton } from "../../components/AppButton";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Header } from "../../components/Header";
import { TextInputField } from "../../components/TextInputField";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { mockMe } from "../../data/mockDomain";
import { changePassword, deleteMe, getMe } from "../../services/api";
import type { UserProfile } from "../../types/domain";

export type SettingsScreenProps = {
  onBack?: () => void;
  onLogout?: () => void;
};

type ConfirmationTarget = "logout" | "delete" | null;

export function SettingsScreen({ onBack, onLogout }: SettingsScreenProps) {
  const [confirmationTarget, setConfirmationTarget] = useState<ConfirmationTarget>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | undefined>(() =>
    process.env.NODE_ENV === "test" ? mockMe : undefined,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const vehicleImages = profile?.vehicle?.images ?? [];
  const email = splitEmail(profile?.email);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return undefined;
    }

    let active = true;

    getMe()
      .then((nextProfile) => {
        if (active) {
          setProfile(nextProfile);
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : "계정 정보를 불러오지 못했어요.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const closeConfirmation = () => {
    if (accountActionLoading) {
      return;
    }
    setConfirmationTarget(null);
  };

  const handleConfirm = async () => {
    if (confirmationTarget === "logout") {
      closeConfirmation();
      onLogout?.();
      return;
    }

    if (confirmationTarget !== "delete" || accountActionLoading) {
      return;
    }

    setAccountActionLoading(true);
    setErrorMessage(null);
    try {
      await deleteMe();
      setConfirmationTarget(null);
      onLogout?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "계정 탈퇴에 실패했어요.");
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordSaving || newPassword.length < 8 || !currentPassword.trim()) {
      return;
    }

    setPasswordSaving(true);
    setErrorMessage(null);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "비밀번호를 변경하지 못했어요.",
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.screen}>
        <Header title="설정" showBack onBack={onBack} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Section title="전화번호">
            <ReadonlyField value={profile?.phone ?? "전화번호 없음"} />
          </Section>

          <Section title="이메일">
            <View style={styles.emailRow}>
              <ReadonlyField value={email.local} style={styles.emailLocalField} />
              <ReadonlyField value={email.domain} style={styles.emailDomainField} />
            </View>
          </Section>

          <Section title="차량 정보">
            <Text style={styles.subsectionLabel}>차량 번호</Text>
            <ReadonlyField
              value={maskPlateNumber(profile?.vehicle?.plateNumber)}
              accessory={<EyeOff size={18} color={colors.gray300} strokeWidth={2.1} />}
            />
            {vehicleImages.length > 0 ? (
              <>
                <Text style={styles.subsectionLabel}>차량 사진</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.vehicleImages}
              >
                {vehicleImages.map((imageUrl, index) => (
                  <Image
                    key={imageUrl}
                    source={{ uri: imageUrl }}
                    style={styles.vehicleImage}
                    testID={`settings-vehicle-image-${index}`}
                  />
                ))}
              </ScrollView>
              </>
            ) : (
              <Text style={styles.emptyText}>등록된 차량 사진이 없어요</Text>
            )}
          </Section>

          <Section title="계정 정보">
            <SettingsMenuRow
              label="비밀번호 변경"
              icon="password"
              onPress={() => setPasswordModalVisible(true)}
            />
            <SettingsMenuRow
              label="계정 탈퇴"
              icon="delete"
              danger
              onPress={() => setConfirmationTarget("delete")}
            />
          </Section>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            label="로그아웃"
            variant="outline"
            onPress={() => setConfirmationTarget("logout")}
          />
        </View>
      </View>

      <ConfirmModal
        visible={confirmationTarget !== null}
        title={
          confirmationTarget === "logout"
            ? "로그아웃하시겠어요?"
            : "계정을 탈퇴하시겠어요?"
        }
        description={
          confirmationTarget === "logout"
            ? "다시 이용하려면 로그인이 필요합니다."
            : "탈퇴하면 저장된 프로필과 모집 내역을 되돌릴 수 없습니다."
        }
        confirmLabel={
          accountActionLoading
            ? "처리 중"
            : confirmationTarget === "logout"
              ? "로그아웃하기"
              : "탈퇴하기"
        }
        cancelLabel="취소"
        confirmVariant={confirmationTarget === "delete" ? "danger" : "primary"}
        onConfirm={() => {
          void handleConfirm();
        }}
        onCancel={closeConfirmation}
        testID="settings-confirm-modal"
      />
      {passwordModalVisible ? (
        <View style={styles.modalOverlay} testID="settings-password-modal">
          <View style={styles.passwordCard}>
            <Text style={styles.passwordTitle}>비밀번호 변경</Text>
            <TextInputField
              label="현재 비밀번호"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              testID="settings-current-password"
            />
            <TextInputField
              label="새 비밀번호"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              error={
                newPassword.length > 0 && newPassword.length < 8
                  ? "8자 이상 입력해주세요."
                  : undefined
              }
              testID="settings-new-password"
            />
            <View style={styles.passwordActions}>
              <AppButton
                label="취소"
                variant="ghost"
                size="medium"
                onPress={() => {
                  if (!passwordSaving) {
                    setPasswordModalVisible(false);
                  }
                }}
                style={styles.passwordAction}
              />
              <AppButton
                label={passwordSaving ? "변경 중" : "변경"}
                size="medium"
                disabled={
                  passwordSaving || !currentPassword.trim() || newPassword.length < 8
                }
                onPress={handleChangePassword}
                style={styles.passwordAction}
                testID="settings-password-submit"
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

type SectionProps = {
  title: string;
  children: ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

type ReadonlyFieldProps = {
  value: string;
  accessory?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

function ReadonlyField({ value, accessory, style }: ReadonlyFieldProps) {
  return (
    <View style={[styles.readonlyField, style]}>
      <Text style={styles.readonlyText}>{value}</Text>
      {accessory}
    </View>
  );
}

type SettingsMenuRowProps = {
  label: string;
  icon: "password" | "delete";
  danger?: boolean;
  onPress?: () => void;
};

function SettingsMenuRow({ label, icon, danger = false, onPress }: SettingsMenuRowProps) {
  const Icon = icon === "password" ? LockKeyhole : Scissors;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}
    >
      <View style={[styles.menuIconFrame, danger && styles.menuIconDanger]}>
        <Icon
          size={18}
          color={danger ? colors.red : colors.mintDark}
          strokeWidth={2.3}
        />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <ChevronRight size={18} color={colors.mutedText} strokeWidth={2.2} />
    </Pressable>
  );
}

function splitEmail(email?: string) {
  if (!email || !email.includes("@")) {
    return { local: "현재 이메일", domain: "@gmail.com" };
  }

  const [local, domain] = email.split("@");
  return { local, domain: `@${domain}` };
}

function maskPlateNumber(plateNumber?: string) {
  if (!plateNumber) {
    return "등록된 차량 없음";
  }

  return plateNumber.replace(/\s*\S{4}$/, " ****");
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 20,
    paddingBottom: 124,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  readonlyField: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  readonlyText: {
    flex: 1,
    color: colors.gray300,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  emailRow: {
    flexDirection: "row",
    gap: 6,
  },
  emailLocalField: {
    flex: 1,
  },
  emailDomainField: {
    width: 98,
  },
  subsectionLabel: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
  },
  vehicleImages: {
    gap: 8,
  },
  vehicleImage: {
    width: 92,
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.gray100,
  },
  emptyText: {
    color: colors.mutedText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
  },
  errorText: {
    color: colors.red,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  menuRow: {
    minHeight: 58,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuIconFrame: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconDanger: {
    backgroundColor: colors.surface,
  },
  menuLabel: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.medium,
  },
  menuLabelDanger: {
    color: colors.red,
  },
  pressed: {
    opacity: 0.76,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 35,
    paddingHorizontal: spacing.screenX,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  passwordCard: {
    width: "100%",
    maxWidth: 360,
    padding: spacing.screenX,
    borderRadius: 18,
    backgroundColor: colors.surface,
    gap: 16,
  },
  passwordTitle: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
    textAlign: "center",
  },
  passwordActions: {
    flexDirection: "row",
    gap: 8,
  },
  passwordAction: {
    flex: 1,
  },
});
