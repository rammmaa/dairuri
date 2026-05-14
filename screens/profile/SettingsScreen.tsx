import { ChevronRight, LockKeyhole, Trash2 } from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ReactNode } from "react";

import { AppButton } from "../../components/AppButton";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Header } from "../../components/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { mockMe } from "../../data/mockDomain";

export type SettingsScreenProps = {
  onBack?: () => void;
  onLogout?: () => void;
};

type ConfirmationTarget = "logout" | "delete" | null;

export function SettingsScreen({ onBack, onLogout }: SettingsScreenProps) {
  const [confirmationTarget, setConfirmationTarget] = useState<ConfirmationTarget>(null);
  const vehicleImages = mockMe.vehicle?.images ?? [];

  const closeConfirmation = () => {
    setConfirmationTarget(null);
  };

  const handleConfirm = () => {
    if (confirmationTarget === "logout") {
      closeConfirmation();
      onLogout?.();
      return;
    }

    closeConfirmation();
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
            <ReadonlyField value={mockMe.phone ?? "전화번호 없음"} />
          </Section>

          <Section title="이메일">
            <ReadonlyField value={mockMe.email ?? "이메일 없음"} />
          </Section>

          <Section title="차량 정보">
            <ReadonlyField value={mockMe.vehicle?.plateNumber ?? "등록된 차량 없음"} />
            {vehicleImages.length > 0 ? (
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
            ) : (
              <Text style={styles.emptyText}>등록된 차량 사진이 없어요</Text>
            )}
          </Section>

          <Section title="계정 정보">
            <SettingsMenuRow label="비밀번호 변경" icon="password" />
            <SettingsMenuRow
              label="계정 탈퇴"
              icon="delete"
              danger
              onPress={() => setConfirmationTarget("delete")}
            />
          </Section>
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
        confirmLabel={confirmationTarget === "logout" ? "로그아웃하기" : "탈퇴하기"}
        cancelLabel="취소"
        confirmVariant={confirmationTarget === "delete" ? "danger" : "primary"}
        onConfirm={handleConfirm}
        onCancel={closeConfirmation}
        testID="settings-confirm-modal"
      />
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
};

function ReadonlyField({ value }: ReadonlyFieldProps) {
  return (
    <View style={styles.readonlyField}>
      <Text style={styles.readonlyText}>{value}</Text>
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
  const Icon = icon === "password" ? LockKeyhole : Trash2;

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
    gap: 22,
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
    justifyContent: "center",
  },
  readonlyText: {
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.medium,
  },
  vehicleImages: {
    gap: 8,
  },
  vehicleImage: {
    width: 112,
    height: 76,
    borderRadius: 16,
    backgroundColor: colors.gray100,
  },
  emptyText: {
    color: colors.mutedText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
  },
  menuRow: {
    minHeight: 58,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuIconFrame: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.mintLight,
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
});
