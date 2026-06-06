import {
  ChevronRight,
  CircleHelp,
  FileBadge,
  Info,
  Inbox,
  Megaphone,
  Pencil,
  Settings,
  UserRound,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BottomNav } from "../components/BottomNav";
import { Header } from "../components/Header";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { bottomNavItems, type BottomNavItem } from "../data/mapHome";
import {
  formatMannerTemperature,
  getMannerTemperatureProgress,
} from "../data/mannerTemperature";
import { mockMe } from "../data/mockDomain";
import { getMe, getReceivedApplications } from "../services/api";
import type { ApplicationDetail, ApplicationStatus, UserProfile } from "../types/domain";
import type { ProfileInfoScreenKind } from "./profile/ProfileInfoScreen";

export type MyPageScreenProps = {
  onSelectTab?: (item: BottomNavItem) => void;
  onOpenProfileScreen?: (
    screen: "edit" | "settings" | "saved" | "mine" | ProfileInfoScreenKind,
  ) => void;
  onOpenApplicationReview?: (applicationId: string) => void;
};

type ProfileMenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  implemented?: boolean;
};

const profileMenuItems: ProfileMenuItem[] = [
  { id: "notice", label: "공지사항", icon: Megaphone, implemented: true },
  { id: "settings", label: "설정", icon: Settings, implemented: true },
  { id: "faq", label: "FAQ", icon: CircleHelp, implemented: true },
  { id: "appInfo", label: "어플 정보", icon: Info, implemented: true },
  { id: "terms", label: "약관 및 정책", icon: FileBadge, implemented: true },
];

export function MyPageScreen({
  onSelectTab,
  onOpenProfileScreen,
  onOpenApplicationReview,
}: MyPageScreenProps) {
  const [profile, setProfile] = useState<UserProfile | undefined>(() =>
    process.env.NODE_ENV === "test" ? mockMe : undefined,
  );
  const [receivedApplications, setReceivedApplications] = useState<ApplicationDetail[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return undefined;
    }

    let active = true;

    getMe()
      .then((nextProfile) => {
        if (!active) {
          return;
        }
        setProfile(nextProfile);
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : "프로필 정보를 불러오지 못했어요.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getReceivedApplications()
      .then((applications) => {
        if (active) {
          setReceivedApplications(applications);
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : "지원 요청을 불러오지 못했어요.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const temperature = profile?.temperature ?? 36.5;
  const temperatureDisplay = formatMannerTemperature(temperature);
  const progress = getMannerTemperatureProgress(temperature);
  const pendingApplications = receivedApplications.filter(
    (detail) => detail.application.status === "pending",
  );
  return (
    <View style={styles.safeArea}>
      <View style={styles.screen}>
        <Header title="프로필" testID="profile-home-header" titleSize="large" />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <UserRound size={42} color={colors.mintDark} strokeWidth={2.1} />
              )}
            </View>

            <View style={styles.profileCopy}>
              <Text style={styles.profileName}>
                {profile?.nickname ?? "닉네임"}
              </Text>
              <Text style={styles.profileStatus}>
                {profile?.driverType === "driver" ? "N년차 운전자" : "비운전자"}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="프로필 수정"
              onPress={() => onOpenProfileScreen?.("edit")}
              testID="profile-edit-button"
              style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
            >
              <Pencil size={17} color={colors.mintDark} strokeWidth={2.2} />
            </Pressable>
          </View>

          <View style={styles.temperatureCard}>
            <View style={styles.temperatureHeader}>
              <Text style={styles.temperatureTitle}>매너온도</Text>
              <View style={styles.temperatureValueGroup}>
                <Text style={styles.temperatureValue}>{temperatureDisplay.value}</Text>
                <Text style={styles.temperatureLabel}>{temperatureDisplay.label}</Text>
              </View>
            </View>
            <View style={styles.temperatureTrack}>
              <View style={[styles.temperatureFill, { width: progress }]} />
            </View>
          </View>

          <View style={styles.applicationCard}>
            <View style={styles.applicationHeader}>
              <View style={styles.applicationTitleRow}>
                <View style={styles.applicationIconFrame}>
                  <Inbox size={18} color={colors.mintDark} strokeWidth={2.2} />
                </View>
                <Text style={styles.applicationTitle}>받은 지원 요청</Text>
              </View>
              <Text style={styles.applicationCount}>
                {pendingApplications.length}건 대기
              </Text>
            </View>

            {pendingApplications.length ? (
              <View style={styles.applicationList}>
                {pendingApplications.slice(0, 3).map((detail) => (
                  <ApplicationReviewEntry
                    key={detail.application.id}
                    detail={detail}
                    onPress={() => onOpenApplicationReview?.(detail.application.id)}
                  />
                ))}
              </View>
            ) : (
              <Text style={styles.applicationEmpty}>
                아직 검토할 지원 요청이 없어요
              </Text>
            )}
          </View>

          <View style={styles.menuList}>
            {profileMenuItems.map((item) => (
              <ProfileMenuRow
                key={item.id}
                item={item}
                onPress={() => {
                  onOpenProfileScreen?.(
                    item.id as "settings" | ProfileInfoScreenKind,
                  );
                }}
              />
            ))}
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </ScrollView>

        <BottomNav
          items={bottomNavItems}
          selectedId="profile"
          onSelect={onSelectTab}
          testID="profile-bottom-nav"
        />
      </View>
    </View>
  );
}

type ApplicationReviewEntryProps = {
  detail: ApplicationDetail;
  onPress: () => void;
};

function ApplicationReviewEntry({ detail, onPress }: ApplicationReviewEntryProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${detail.application.applicant.nickname} 지원 검토`}
      onPress={onPress}
      testID={`application-review-entry-${detail.application.id}`}
      style={({ pressed }) => [
        styles.applicationRow,
        pressed && styles.menuRowPressed,
      ]}
    >
      <View style={styles.applicationCopy}>
        <Text style={styles.applicationPostTitle} numberOfLines={1}>
          {detail.post.title}
        </Text>
        <Text style={styles.applicationApplicant} numberOfLines={1}>
          {detail.application.applicant.nickname}
        </Text>
      </View>
      <Text style={styles.applicationStatus}>
        {formatApplicationStatus(detail.application.status)}
      </Text>
      <ChevronRight size={18} color={colors.mutedText} strokeWidth={2.2} />
    </Pressable>
  );
}

function formatApplicationStatus(status: ApplicationStatus) {
  if (status === "accepted") {
    return "승인";
  }

  if (status === "rejected") {
    return "거절";
  }

  return "검토";
}

type ProfileMenuRowProps = {
  item: ProfileMenuItem;
  onPress?: () => void;
};

function ProfileMenuRow({ item, onPress }: ProfileMenuRowProps) {
  const Icon = item.icon;
  const disabled = !item.implemented;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      testID={`profile-menu-${item.id}`}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.menuRow,
        disabled && styles.menuRowDisabled,
        pressed && !disabled && styles.menuRowPressed,
      ]}
    >
      <View style={styles.menuIconFrame}>
        <Icon
          size={20}
          color={disabled ? colors.gray300 : colors.gray400}
          strokeWidth={2.1}
        />
      </View>

      <Text style={[styles.menuLabel, disabled && styles.menuLabelDisabled]}>
        {item.label}
      </Text>

      <ChevronRight size={19} color={colors.mutedText} strokeWidth={2.2} />
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
    backgroundColor: colors.sheet,
    overflow: "hidden",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: spacing.navHeight + 30,
    gap: 10,
  },
  profileCard: {
    width: "100%",
    minHeight: 88,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mintLight,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  profileName: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  profileStatus: {
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.76,
  },
  temperatureCard: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 13,
  },
  temperatureHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  temperatureTitle: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  temperatureValue: {
    color: colors.yellowText,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  temperatureValueGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  temperatureLabel: {
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.yellowLight,
    color: colors.yellowText,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: 24,
  },
  temperatureTrack: {
    height: 14,
    borderRadius: 999,
    backgroundColor: colors.gray300,
    overflow: "hidden",
  },
  temperatureFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.mint,
  },
  temperatureHint: {
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    textAlign: "left",
  },
  menuList: {
    width: "100%",
    gap: 10,
  },
  menuRowDisabled: {
    opacity: 0.48,
  },
  menuLabelDisabled: {
    color: colors.gray400,
  },
  applicationCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 12,
  },
  applicationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  applicationTitleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  applicationIconFrame: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  applicationTitle: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  applicationCount: {
    color: colors.mintDark,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  applicationList: {
    gap: 8,
  },
  applicationRow: {
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  applicationCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  applicationPostTitle: {
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  applicationApplicant: {
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  applicationStatus: {
    color: colors.mintDark,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  applicationEmpty: {
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  errorText: {
    color: colors.red,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  menuRow: {
    minHeight: 56,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuRowPressed: {
    backgroundColor: colors.mintLight,
  },
  menuIconFrame: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
});
