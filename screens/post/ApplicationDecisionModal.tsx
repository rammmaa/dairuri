import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { TextInputField } from "../../components/TextInputField";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import type { PostType } from "../../types/domain";

export type ApplicationDecisionModalMode = "approved" | "rejectReason" | "rejected";

export type ApplicationDecisionModalProps = {
  visible: boolean;
  mode: ApplicationDecisionModalMode;
  reason?: string;
  onReasonChange?: (reason: string) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  onGoHome?: () => void;
  onOpenChat?: () => void;
  confirmDisabled?: boolean;
  postType?: PostType;
};

const defaultCompletionCopy = {
  approved: {
    title: "승인 완료",
    description: "지원자를 승인했습니다.",
    confirmLabel: "확인",
    confirmTestID: "application-approval-confirm",
  },
  rejected: {
    title: "매칭 신청 반려",
    description: "지원자에게 반려 알림을 보냈습니다.",
    confirmLabel: "확인",
    confirmTestID: "application-rejected-confirm",
  },
} as const;

function getCompletionCopy(
  mode: Exclude<ApplicationDecisionModalMode, "rejectReason">,
  postType?: PostType,
) {
  if (mode === "approved" && postType === "carpool") {
    return {
      title: "승인 완료",
      description: "자동으로 채팅방에 초대되었어요.\n인사를 나눠보세요!",
      confirmLabel: "홈으로",
      confirmTestID: "application-approval-home",
    };
  }

  return defaultCompletionCopy[mode];
}

export function ApplicationDecisionModal({
  visible,
  mode,
  reason = "",
  onReasonChange,
  onConfirm,
  onCancel,
  onGoHome,
  onOpenChat,
  confirmDisabled = false,
  postType,
}: ApplicationDecisionModalProps) {
  if (!visible) {
    return null;
  }

  if (mode === "rejectReason") {
    return (
      <View style={styles.overlay} testID="application-reject-reason-modal">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="모달 닫기"
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.card}>
          <Text style={styles.title}>거절 사유를 작성해주세요.</Text>
          <TextInputField
            value={reason}
            onChangeText={onReasonChange ?? (() => undefined)}
            placeholder="거절 사유 입력"
            multiline
            testID="application-reject-reason"
          />
          <View style={styles.actionColumn}>
            <AppButton
              label="보내기"
              onPress={onConfirm}
              disabled={confirmDisabled}
              testID="application-reject-submit"
            />
            {onCancel ? (
              <AppButton label="취소" variant="ghost" onPress={onCancel} />
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  const copy = getCompletionCopy(mode, postType);
  const showCarpoolApprovalActions =
    mode === "approved" && postType === "carpool" && Boolean(onOpenChat);

  return (
    <View style={styles.overlay} testID={`application-${mode}-modal`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="모달 닫기"
        onPress={onCancel}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.card}>
        <View style={styles.iconFrame}>
          <Check size={26} color={colors.mintDark} strokeWidth={2.5} />
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.description}>{copy.description}</Text>
        <View style={showCarpoolApprovalActions ? styles.actionRow : styles.actionColumn}>
          {showCarpoolApprovalActions ? (
            <>
              <AppButton
                label="홈으로"
                onPress={onGoHome ?? onConfirm}
                testID="application-approval-home"
                style={styles.actionButton}
              />
              <AppButton
                label="채팅방 이동"
                variant="yellow"
                onPress={onOpenChat}
                testID="application-approval-chat"
                style={styles.actionButton}
              />
            </>
          ) : (
            <>
              {mode === "approved" && onOpenChat ? (
                <AppButton label="채팅방으로 이동하기" onPress={onOpenChat} />
              ) : null}
              <AppButton
                label={copy.confirmLabel}
                variant={mode === "approved" && onOpenChat ? "outline" : "primary"}
                onPress={onConfirm}
                testID={copy.confirmTestID}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    paddingHorizontal: 24,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    padding: spacing.screenX,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 16,
  },
  iconFrame: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.mintLight,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    textAlign: "center",
  },
  description: {
    color: colors.grayIcon,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: "center",
  },
  actionColumn: {
    gap: 8,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
