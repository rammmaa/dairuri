import { Check } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { Header } from "../../components/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { submitReport as submitReportRequest } from "../../services/api";

export type ReportScreenProps = {
  roomId: string;
  onBack?: () => void;
  onSubmitted?: () => void;
};

const reportReasons = [
  "위법 거래 및 계정거래 유도",
  "사기·기타 의심",
  "가품 판매 의심",
  "사진 도용 및 부적절한 홍보",
  "잘못된 브랜드 정보 또는 태그",
  "욕설 및 비매너 사용",
] as const;

export function ReportScreen({ roomId, onBack, onSubmitted }: ReportScreenProps) {
  const [selectedReason, setSelectedReason] = useState<(typeof reportReasons)[number] | null>(
    null,
  );
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submitReport = async () => {
    if (!selectedReason || submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await submitReportRequest(roomId, selectedReason);
      setSubmitted(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "신고를 제출하지 못했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.safeArea}>
        <Header title="신고하기" showBack onBack={onBack} />
        <View style={styles.completeBody}>
          <View style={styles.completeIcon}>
            <Check size={30} color={colors.mintDark} strokeWidth={2.5} />
          </View>
          <Text style={styles.completeTitle}>신고가 접수되었습니다</Text>
          <Text style={styles.completeDescription}>
            접수된 내용은 다로리 운영팀이 확인할게요.
          </Text>
          <AppButton label="채팅방으로 돌아가기" onPress={onSubmitted ?? onBack} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <Header title="신고하기" showBack onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>신고 사유를 선택해주세요</Text>
        <Text style={styles.description}>자세한 사유를 함께 알려주시면 도움이 돼요!</Text>
        <Text style={styles.roomHint}>신고 대상 채팅방: {roomId}</Text>

        <View style={styles.reasonList}>
          {reportReasons.map((reason) => {
            const selected = selectedReason === reason;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={reason}
                key={reason}
                onPress={() => {
                  setSelectedReason(reason);
                  if (errorMessage) {
                    setErrorMessage(null);
                  }
                }}
                style={({ pressed }) => [
                  styles.reasonItem,
                  selected && styles.reasonItemSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>
                  {reason}
                </Text>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <AppButton
          label={submitting ? "제출 중" : "신고 제출"}
          disabled={!selectedReason || submitting}
          onPress={submitReport}
          testID="report-submit-button"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 28,
    paddingBottom: 120,
  },
  title: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  description: {
    marginTop: 8,
    color: colors.grayIcon,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  roomHint: {
    marginTop: 12,
    color: colors.gray400,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  reasonList: {
    marginTop: 28,
    gap: 10,
  },
  reasonItem: {
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  reasonItemSelected: {
    borderColor: colors.mint,
    backgroundColor: colors.mintLight,
  },
  pressed: {
    opacity: 0.76,
  },
  reasonText: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  reasonTextSelected: {
    color: colors.mintDark,
    fontFamily: typography.family.bold,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  radioSelected: {
    borderColor: colors.mint,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.mint,
  },
  footer: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: spacing.bottomButton,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    gap: 10,
  },
  errorText: {
    color: colors.red,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  completeBody: {
    flex: 1,
    paddingHorizontal: spacing.screenX,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  completeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  completeTitle: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    textAlign: "center",
  },
  completeDescription: {
    marginBottom: 10,
    color: colors.grayIcon,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: "center",
  },
});
