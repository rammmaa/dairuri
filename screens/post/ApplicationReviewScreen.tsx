import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { Header } from "../../components/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { mockApplications, mockPosts } from "../../data/mockDomain";
import { acceptApplication, rejectApplication } from "../../services/api";
import type { Application, Post } from "../../types/domain";
import {
  ApplicationDecisionModal,
  type ApplicationDecisionModalMode,
} from "./ApplicationDecisionModal";

export type ApplicationReviewScreenProps = {
  applicationId: string;
  onBack?: () => void;
  onOpenChat?: () => void;
};

const formatTemperature = (temperature: number) => `${temperature.toFixed(1)}°C`;

function findApplication(applicationId: string): Application {
  return (
    mockApplications.find((application) => application.id === applicationId) ??
    mockApplications[0]
  );
}

function findLinkedPost(application: Application): Post | undefined {
  return mockPosts.find((post) => post.id === application.postId);
}

export function ApplicationReviewScreen({
  applicationId,
  onBack,
  onOpenChat,
}: ApplicationReviewScreenProps) {
  const application = useMemo(() => findApplication(applicationId), [applicationId]);
  const linkedPost = useMemo(() => findLinkedPost(application), [application]);
  const [modalMode, setModalMode] = useState<ApplicationDecisionModalMode | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const trimmedReason = rejectReason.trim();
  const isRejectSubmitDisabled = trimmedReason.length < 5;

  const handleApprove = () => {
    void acceptApplication(application.id);
    setModalMode("approved");
  };

  const handleRejectSubmit = () => {
    if (isRejectSubmitDisabled) {
      return;
    }

    void rejectApplication(application.id, trimmedReason);
    setRejectReason("");
    setModalMode("rejected");
  };

  const closeModal = () => {
    setModalMode(null);
  };

  const openChatFromModal = () => {
    closeModal();
    onOpenChat?.();
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
                {linkedPost.type === "job" ? "알바" : "정기 라이딩"}
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
      </ScrollView>

      <View style={styles.footer}>
        <AppButton
          label="거절"
          variant="danger"
          onPress={() => setModalMode("rejectReason")}
          testID="application-reject-button"
          style={styles.footerButton}
        />
        <AppButton
          label="승인"
          onPress={handleApprove}
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
        confirmDisabled={isRejectSubmitDisabled}
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
