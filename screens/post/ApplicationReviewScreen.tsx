import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { Header } from "../../components/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { mockApplications, mockPosts } from "../../data/mockDomain";
import {
  acceptApplication,
  getApplicationDetail,
  rejectApplication,
} from "../../services/api";
import type { ApplicationDetail } from "../../types/domain";
import {
  ApplicationDecisionModal,
  type ApplicationDecisionModalMode,
} from "./ApplicationDecisionModal";

export type ApplicationReviewScreenProps = {
  applicationId: string;
  onBack?: () => void;
  onOpenChat?: (roomId: string) => void;
};

const formatTemperature = (temperature: number) => `${temperature.toFixed(1)}°C`;

function getInitialApplicationDetail(
  applicationId: string,
): ApplicationDetail | undefined {
  if (process.env.NODE_ENV !== "test") {
    return undefined;
  }

  const application =
    mockApplications.find((item) => item.id === applicationId) ?? mockApplications[0];
  const post = mockPosts.find((item) => item.id === application.postId);
  return post ? { application, post } : undefined;
}

export function ApplicationReviewScreen({
  applicationId,
  onBack,
  onOpenChat,
}: ApplicationReviewScreenProps) {
  const initialDetail = useMemo(
    () => getInitialApplicationDetail(applicationId),
    [applicationId],
  );
  const [detail, setDetail] = useState<ApplicationDetail | undefined>(initialDetail);
  const [modalMode, setModalMode] = useState<ApplicationDecisionModalMode | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acceptedRoomId, setAcceptedRoomId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return undefined;
    }

    let active = true;
    setErrorMessage(null);

    getApplicationDetail(applicationId)
      .then((nextDetail) => {
        if (active) {
          setDetail(nextDetail);
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "지원서를 불러오지 못했어요.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, [applicationId]);

  if (!detail) {
    return (
      <View style={styles.safeArea}>
        <Header title="지원서" showBack onBack={onBack} />
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>
            {errorMessage ?? "지원서를 불러오는 중이에요"}
          </Text>
        </View>
      </View>
    );
  }

  const { application, post: linkedPost } = detail;

  const trimmedReason = rejectReason.trim();
  const isRejectSubmitDisabled = trimmedReason.length < 5;

  const handleApprove = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const room = await acceptApplication(application.id);
      setAcceptedRoomId(room.id);
      setDetail((current) =>
        current
          ? {
              ...current,
              application: { ...current.application, status: "accepted" },
            }
          : current,
      );
      setModalMode("approved");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "승인 처리에 실패했어요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (isRejectSubmitDisabled || submitting) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await rejectApplication(application.id, trimmedReason);
      setDetail((current) =>
        current
          ? {
              ...current,
              application: {
                ...current.application,
                status: "rejected",
                rejectionReason: trimmedReason,
              },
            }
          : current,
      );
      setRejectReason("");
      setModalMode("rejected");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "거절 처리에 실패했어요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalMode(null);
  };

  const openChatFromModal = () => {
    closeModal();
    if (acceptedRoomId) {
      onOpenChat?.(acceptedRoomId);
    }
  };

  return (
    <View style={styles.safeArea}>
      <Header title="지원서" showBack onBack={onBack} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{application.applicant.nickname.slice(0, 1)}</Text>
          </View>
          <View style={styles.profileTextBlock}>
            <Text style={styles.nickname}>{application.applicant.nickname}</Text>
            {application.applicant.phone ? (
              <Text style={styles.phone}>{application.applicant.phone}</Text>
            ) : null}
          </View>
          <View style={styles.temperatureBadge}>
            <Text style={styles.temperatureText}>
              {formatTemperature(application.applicant.temperature)}
            </Text>
          </View>
        </View>

        {linkedPost ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>연결된 모집글</Text>
            <View style={styles.linkedPostCard}>
              <Text style={styles.linkedPostType}>
                {linkedPost.type === "job" ? "인적 자원" : "정기 라이딩"}
              </Text>
              <Text style={styles.linkedPostTitle}>{linkedPost.title}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>자기소개</Text>
          <View style={styles.introCard} testID="application-intro-card">
            <Text style={styles.introText}>{application.intro}</Text>
          </View>
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          label="거절"
          variant="danger"
          onPress={() => setModalMode("rejectReason")}
          disabled={submitting}
          testID="application-reject-button"
          style={styles.footerButton}
        />
        <AppButton
          label={submitting ? "처리 중" : "승인"}
          onPress={handleApprove}
          disabled={submitting}
          testID="application-approve-button"
          style={styles.footerButton}
        />
      </View>

      <ApplicationDecisionModal
        visible={modalMode !== null}
        mode={modalMode ?? "approved"}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={modalMode === "rejectReason" ? handleRejectSubmit : closeModal}
        onCancel={closeModal}
        onOpenChat={modalMode === "approved" ? openChatFromModal : undefined}
        confirmDisabled={submitting || isRejectSubmitDisabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.screenX,
    paddingBottom: 112,
    gap: 20,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.screenX,
  },
  loadingText: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.regular,
    textAlign: "center",
  },
  profileCard: {
    minHeight: 84,
    padding: 16,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.mintDark,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
  },
  profileTextBlock: {
    flex: 1,
    gap: 4,
  },
  nickname: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
  },
  phone: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
  },
  temperatureBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.yellowLight,
  },
  temperatureText: {
    color: colors.yellowText,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
  },
  linkedPostCard: {
    padding: 16,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    gap: 6,
  },
  linkedPostType: {
    color: colors.mintDark,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.bold,
  },
  linkedPostTitle: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
  },
  introCard: {
    minHeight: 180,
    padding: 16,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.gray50,
  },
  introText: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.regular,
  },
  errorText: {
    color: colors.red,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: spacing.bottomButton,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    gap: 10,
  },
  footerButton: {
    flex: 1,
  },
});
