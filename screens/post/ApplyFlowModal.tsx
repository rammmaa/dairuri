import { CheckCircle2 } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { CheckBoxRow } from "../../components/CheckBoxRow";
import { TextInputField } from "../../components/TextInputField";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { applyToPost } from "../../services/api";
import type { Post } from "../../types/domain";

type ApplyStep = 1 | 2 | 3;

type TermsState = {
  all: boolean;
  service: boolean;
  privacy: boolean;
  thirdParty: boolean;
};

export type ApplyFlowModalProps = {
  visible: boolean;
  post: Post;
  onClose: () => void;
  onOpenChat?: () => void;
};

const initialTerms: TermsState = {
  all: false,
  service: false,
  privacy: false,
  thirdParty: false,
};

export function ApplyFlowModal({
  visible,
  post,
  onClose,
  onOpenChat,
}: ApplyFlowModalProps) {
  const [step, setStep] = useState<ApplyStep>(1);
  const [intro, setIntro] = useState("");
  const [terms, setTerms] = useState<TermsState>(initialTerms);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setStep(1);
      setIntro("");
      setTerms(initialTerms);
      setSubmitting(false);
      setSubmitError(null);
    }
  }, [visible]);

  const introValid = intro.trim().length >= 10;
  const requiredTermsChecked = terms.service && terms.privacy && terms.thirdParty;
  const themeColor = post.type === "job" ? colors.yellow : colors.mint;
  const isResourceProfile = post.type === "job" && post.profileMode === "resource";

  const stepTitle = useMemo(() => {
    if (step === 1) {
      return isResourceProfile ? "연락 내용 작성" : "자기소개 작성";
    }

    if (step === 2) {
      return "약관 동의";
    }

    return isResourceProfile ? "연락 요청 완료" : "지원 완료";
  }, [isResourceProfile, step]);

  if (!visible) {
    return null;
  }

  const setRequiredTerms = (checked: boolean) => {
    setTerms({
      all: checked,
      service: checked,
      privacy: checked,
      thirdParty: checked,
    });
  };

  const toggleTerm = (key: keyof Omit<TermsState, "all">) => {
    setTerms((current) => {
      const next = {
        ...current,
        [key]: !current[key],
      };
      const all = next.service && next.privacy && next.thirdParty;

      return { ...next, all };
    });
  };

  const submitApplication = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await applyToPost(post.id, intro.trim());
      setStep(3);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "지원 요청을 보내지 못했어요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const complete = () => {
    onClose();
    onOpenChat?.();
  };

  return (
    <View style={styles.overlay} testID="apply-flow-modal">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="지원 모달 닫기"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.card}>
        <View style={[styles.progress, { backgroundColor: themeColor }]} />
        <Text style={styles.stepLabel}>{stepTitle}</Text>

        {step === 1 ? (
          <View style={styles.content}>
            <Text style={styles.title}>
              {isResourceProfile
                ? "연락 내용을 작성해주세요"
                : "자기소개서를 작성해주세요"}
            </Text>
            <TextInputField
              value={intro}
              onChangeText={setIntro}
              placeholder={
                isResourceProfile
                  ? "요청할 일과 시간을 작성해주세요"
                  : "자기소개를 작성해주세요"
              }
              multiline
              maxLength={300}
              testID="apply-intro-input"
            />
            <Text style={styles.helper}>10자 이상 작성하면 다음 단계로 이동할 수 있어요.</Text>
            <AppButton
              label="다음"
              disabled={!introValid}
              onPress={() => setStep(2)}
              testID="apply-next-button"
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.content}>
            <Text style={styles.title}>약관 동의</Text>
            <View style={styles.termsList}>
              <CheckBoxRow
                label="약관 전체 동의"
                checked={terms.all}
                onPress={() => setRequiredTerms(!terms.all)}
                testID="terms-all"
              />
              <View style={styles.divider} />
              <CheckBoxRow
                label="서비스 이용약관"
                checked={terms.service}
                onPress={() => toggleTerm("service")}
                testID="terms-service"
              />
              <CheckBoxRow
                label="개인정보 수집 및 이용 동의"
                checked={terms.privacy}
                onPress={() => toggleTerm("privacy")}
                testID="terms-privacy"
              />
              <CheckBoxRow
                label="제3자 제공 동의"
                checked={terms.thirdParty}
                onPress={() => toggleTerm("thirdParty")}
                testID="terms-third-party"
              />
            </View>
            <AppButton
              label={submitting ? "처리 중" : "확인"}
              disabled={!requiredTermsChecked || submitting}
              onPress={submitApplication}
              testID="apply-terms-confirm-button"
            />
            {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
          </View>
        ) : null}

        {step === 3 ? (
          <View style={[styles.content, styles.completeContent]}>
            <View style={styles.completeIcon}>
              <CheckCircle2 size={34} color={colors.mintDark} strokeWidth={2.3} />
            </View>
            <Text style={styles.completeTitle}>
              {isResourceProfile ? "연락 요청 완료" : "지원 완료"}
            </Text>
            <Text style={styles.description}>
              {isResourceProfile
                ? "작성하신 연락 내용이 등록자에게 전달되었습니다.\n채팅에서 이어서 이야기해보세요."
                : "작성하신 지원서가 작성자에게 전달되었습니다.\n검토 후 연락 드릴게요!"}
            </Text>
            <AppButton label="확인" onPress={complete} testID="apply-complete-button" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    paddingHorizontal: spacing.screenX,
    backgroundColor: colors.overlay,
    justifyContent: "flex-end",
  },
  card: {
    marginBottom: 18,
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: 24,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 14,
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  progress: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 2,
  },
  stepLabel: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.medium,
    textAlign: "center",
  },
  content: {
    gap: 14,
  },
  title: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
  },
  helper: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
  },
  errorText: {
    color: colors.red,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  termsList: {
    paddingVertical: 4,
    gap: 4,
  },
  divider: {
    height: 1,
    marginVertical: 4,
    backgroundColor: colors.line,
  },
  completeContent: {
    alignItems: "center",
  },
  completeIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  completeTitle: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
    textAlign: "center",
  },
  description: {
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
    textAlign: "center",
  },
});
