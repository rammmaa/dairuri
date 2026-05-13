import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "../../components/AppIcon";
import { colors } from "../../theme/tokens";

const menuItems = ["공지사항", "설정", "FAQ", "어플 정보", "약관 및 정책"];

export function ProfileScreen() {
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
          <Text style={styles.profileName}>닉네임</Text>
          <Text style={styles.profileSub}>김XX</Text>
          <Text style={styles.profileSub}>N년차 운전자</Text>
        </View>
        <AppIcon name="edit-2" size={20} color={colors.active} />
      </View>
      <View style={styles.mannerCard}>
        <View style={styles.mannerRow}>
          <Text style={styles.menuTitle}>매너온도</Text>
          <Text style={styles.temperature}>40.6도</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
        <Text style={styles.profileSub}>완료한 세어라이드 NN회</Text>
      </View>
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
