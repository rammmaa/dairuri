import {
  ChevronRight,
  FileText,
  Heart,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BottomNav } from "../components/BottomNav";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { bottomNavItems, type BottomNavItem } from "../data/mapHome";

export type MyPageScreenProps = {
  onSelectTab?: (item: BottomNavItem) => void;
  onOpenProfileScreen?: (screen: "edit" | "settings" | "saved" | "mine") => void;
  onOpenApplicationReview?: (applicationId: string) => void;
};

type ProfileStat = {
  id: "saved" | "recruitments" | "completed";
  label: string;
  value: string;
};

type ProfileMenuItem = {
  id: string;
  label: string;
  detail: string;
  icon: LucideIcon;
};

const profileStats: ProfileStat[] = [
  { id: "saved", label: "찜한 글", value: "12" },
  { id: "recruitments", label: "모집글", value: "3" },
  { id: "completed", label: "참여 완료", value: "8" },
];

const profileMenuItems: ProfileMenuItem[] = [
  { id: "liked", label: "내 찜", detail: "저장한 모집글", icon: Heart },
  {
    id: "recruitments",
    label: "내가 쓴 모집글",
    detail: "진행 중 2개",
    icon: FileText,
  },
  { id: "settings", label: "설정", detail: "알림 및 계정", icon: Settings },
];

export function MyPageScreen({
  onSelectTab,
  onOpenProfileScreen,
  onOpenApplicationReview,
}: MyPageScreenProps) {
  return (
    <View style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>프로필</Text>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              <View style={styles.avatar}>
                <UserRound size={34} color={colors.mintDark} strokeWidth={2.2} />
              </View>

              <View style={styles.profileCopy}>
                <View style={styles.nameRow}>
                  <Text style={styles.profileName}>다로리인</Text>
                  <View style={styles.badge}>
                    <ShieldCheck
                      size={13}
                      color={colors.mintDark}
                      strokeWidth={2.4}
                    />
                    <Text style={styles.badgeText}>인증 완료</Text>
                  </View>
                </View>
                <Text style={styles.profileMeta}>홍대입구 주변 · 평일 오후</Text>
                <Text style={styles.profileStatus}>함께 이동할 친구를 찾는 중</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              {profileStats.map((stat) => (
                <Pressable
                  key={stat.id}
                  accessibilityRole="button"
                  accessibilityLabel={stat.label}
                  onPress={() => {
                    if (stat.id === "saved") {
                      onOpenProfileScreen?.("saved");
                    } else if (stat.id === "completed") {
                      onOpenApplicationReview?.("application-1");
                    } else {
                      onOpenProfileScreen?.("mine");
                    }
                  }}
                  testID={`profile-stat-${stat.id}`}
                  style={({ pressed }) => [
                    styles.statItem,
                    pressed && styles.statItemPressed,
                  ]}
                >
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.menuList}>
            {profileMenuItems.map((item) => (
              <ProfileMenuRow
                key={item.id}
                item={item}
                onPress={() => {
                  if (item.id === "liked") {
                    onOpenProfileScreen?.("saved");
                  } else if (item.id === "recruitments") {
                    onOpenProfileScreen?.("mine");
                  } else if (item.id === "settings") {
                    onOpenProfileScreen?.("settings");
                  }
                }}
              />
            ))}
          </View>
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

type ProfileMenuRowProps = {
  item: ProfileMenuItem;
  onPress?: () => void;
};

function ProfileMenuRow({ item, onPress }: ProfileMenuRowProps) {
  const Icon = item.icon;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        pressed && styles.menuRowPressed,
      ]}
    >
      <View style={styles.menuIconFrame}>
        <Icon size={20} color={colors.mintDark} strokeWidth={2.3} />
      </View>

      <View style={styles.menuCopy}>
        <Text style={styles.menuLabel}>{item.label}</Text>
        <Text style={styles.menuDetail}>{item.detail}</Text>
      </View>

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
    paddingTop: 52,
    paddingBottom: spacing.navHeight + 30,
    gap: 16,
  },
  header: {
    minHeight: 34,
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: typography.weight.bold,
  },
  profileCard: {
    width: "100%",
    padding: 18,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    gap: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mintLight,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  profileName: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
  },
  badge: {
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.mintLight,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    color: colors.mintDark,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.bold,
  },
  profileMeta: {
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
  },
  profileStatus: {
    color: colors.mutedText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
  },
  statsRow: {
    minHeight: 72,
    borderRadius: 10,
    backgroundColor: colors.mintLight,
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  statItemPressed: {
    backgroundColor: "rgba(0, 166, 100, 0.08)",
  },
  statValue: {
    color: colors.mintDark,
    fontFamily: typography.family.body,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
  },
  statLabel: {
    width: "100%",
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
    textAlign: "center",
  },
  menuList: {
    width: "100%",
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  menuRow: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuRowPressed: {
    backgroundColor: colors.mintLight,
  },
  menuIconFrame: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mintLight,
  },
  menuCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  menuLabel: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
  },
  menuDetail: {
    color: colors.mutedText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
  },
});
