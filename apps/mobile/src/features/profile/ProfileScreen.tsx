import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  verificationBadgeLabels,
  type UserProfileSummary,
} from "@dairuri/shared";
import { AppIcon } from "../../components/AppIcon";
import { fetchMyProfile } from "../../services/api/dairuriApi";
import { colors } from "../../theme/tokens";

const menuItems = ["공지사항", "설정", "FAQ", "어플 정보", "약관 및 정책"];
const fallbackProfile: UserProfileSummary = {
  id: "fallback-user",
  nickname: "닉네임",
  driverYears: 0,
  mannerTemperature: 40.6,
  completedRides: 0,
  completedJobs: 0,
  recommendationRate: 0,
  verifications: [],
};

export function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfileSummary>(fallbackProfile);

  useEffect(() => {
    let isMounted = true;

    fetchMyProfile()
      .then((nextProfile) => {
        if (isMounted) {
          setProfile(nextProfile);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProfile(fallbackProfile);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <View style={styles.header}>
        <AppIcon name="chevron-left" size={24} color={colors.ink} />
        <Text style={styles.headerTitle}>프로필</Text>
      </View>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>D</Text>
        </View>
        <View style={styles.profileTextBlock}>
          <Text style={styles.profileName}>{profile.nickname}</Text>
          <Text style={styles.profileSub}>김XX</Text>
          <Text style={styles.profileSub}>{profile.driverYears}년차 운전자</Text>
        </View>
        <AppIcon name="edit-2" size={20} color={colors.active} />
      </View>
      <View style={styles.mannerCard}>
        <View style={styles.mannerRow}>
          <Text style={styles.menuTitle}>매너온도</Text>
          <Text style={styles.temperature}>{profile.mannerTemperature.toFixed(1)}도</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.profileSub}>완료한 셰어라이드 {profile.completedRides}회</Text>
        <Text style={styles.profileSub}>완료한 일자리 {profile.completedJobs}회</Text>
        <Text style={styles.profileSub}>추천률 {profile.recommendationRate}%</Text>
      </View>
      {profile.verifications.length > 0 ? (
        <View style={styles.badgeSection}>
          {profile.verifications.map((badge) => (
            <View key={badge} style={styles.badge}>
              <Text style={styles.badgeText}>{verificationBadgeLabels[badge]}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {menuItems.map((item) => (
        <View key={item} style={styles.menuRow}>
          <Text style={styles.menuTitle}>{item}</Text>
          <AppIcon name="chevron-right" size={22} color={colors.iconLight} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    minHeight: "100%",
    paddingBottom: 100,
    backgroundColor: colors.background,
  },
  header: {
    height: 72,
    paddingHorizontal: 22,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: colors.headerText,
    fontSize: 20,
    fontWeight: "700",
  },
  profileCard: {
    marginHorizontal: 26,
    marginTop: 20,
    borderRadius: 18,
    backgroundColor: colors.cardSubtle,
    minHeight: 135,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 2,
    borderColor: colors.avatarBorder,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.active,
    fontSize: 32,
    fontWeight: "900",
  },
  profileTextBlock: {
    flex: 1,
  },
  profileName: {
    color: colors.black,
    fontSize: 24,
    fontWeight: "800",
  },
  profileSub: {
    color: colors.profileSub,
    fontSize: 14,
    lineHeight: 22,
  },
  mannerCard: {
    marginHorizontal: 26,
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: colors.cardSubtle,
    padding: 28,
  },
  badgeSection: {
    marginHorizontal: 26,
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.active,
    backgroundColor: colors.activeSoft,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  badgeText: {
    color: colors.tabTextActive,
    fontSize: 13,
    fontWeight: "800",
  },
  mannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  menuTitle: {
    color: colors.black,
    fontSize: 17,
    fontWeight: "800",
  },
  temperature: {
    color: colors.warning,
    fontSize: 18,
    fontWeight: "800",
  },
  progressTrack: {
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.progressTrack,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    width: "78%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: colors.active,
  },
  menuRow: {
    marginHorizontal: 26,
    marginTop: 12,
    minHeight: 62,
    borderRadius: 16,
    backgroundColor: colors.cardSubtle,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
