import { FileText } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Header } from "../../components/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { mockMe, mockPosts } from "../../data/mockDomain";
import type { Post } from "../../types/domain";
import { ProfilePostCard } from "./SavedPostsScreen";

export type MyPostsScreenProps = {
  onBack?: () => void;
  posts?: Post[];
  userId?: string;
};

export function MyPostsScreen({
  onBack,
  posts = mockPosts,
  userId = mockMe.id,
}: MyPostsScreenProps) {
  const myPosts = posts.filter((post) => post.author.id === userId);

  return (
    <View style={styles.safeArea}>
      <View style={styles.screen}>
        <Header
          title="내가 쓴 모집글"
          showBack
          onBack={onBack}
          backTestID="profile-subscreen-back"
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.countText}>총 {myPosts.length}건</Text>

          {myPosts.length > 0 ? (
            <View style={styles.cardList}>
              {myPosts.map((post) => (
                <ProfilePostCard key={post.id} post={post} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <FileText size={30} color={colors.gray400} strokeWidth={2.1} />
              <Text style={styles.emptyTitle}>아직 작성한 모집글이 없어요</Text>
              <Text style={styles.emptyDescription}>
                모집글을 작성하면 진행 중인 글과 마감된 글을 여기에서 확인할 수 있어요.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
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
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 14,
  },
  countText: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
  },
  cardList: {
    gap: 10,
  },
  emptyCard: {
    minHeight: 188,
    padding: 24,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
    textAlign: "center",
  },
  emptyDescription: {
    color: colors.mutedText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
    textAlign: "center",
  },
});
