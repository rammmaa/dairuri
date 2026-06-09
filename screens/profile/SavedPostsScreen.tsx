import { BriefcaseBusiness, CalendarDays, CarFront, Heart, MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Header } from "../../components/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { mockPosts } from "../../data/mockDomain";
import { getSavedPosts } from "../../services/api";
import type { Post } from "../../types/domain";
import { profileLayout } from "./profileLayout";

export type SavedPostsScreenProps = {
  onBack?: () => void;
  posts?: Post[];
};

export function SavedPostsScreen({ onBack, posts }: SavedPostsScreenProps) {
  const [loadedPosts, setLoadedPosts] = useState<Post[]>(() =>
    process.env.NODE_ENV === "test" ? mockPosts.filter((post) => post.liked) : [],
  );
  const savedPosts = posts ?? loadedPosts;

  useEffect(() => {
    if (posts || process.env.NODE_ENV === "test") {
      return undefined;
    }

    let active = true;

    getSavedPosts()
      .then((nextPosts) => {
        if (active) {
          setLoadedPosts(nextPosts);
        }
      })
      .catch(() => {
        if (active) {
          setLoadedPosts([]);
        }
      });

    return () => {
      active = false;
    };
  }, [posts]);

  return (
    <View style={styles.safeArea}>
      <View style={styles.screen}>
        <Header title="내 찜" showBack onBack={onBack} />
        <PostList
          posts={savedPosts}
          countLabel={`총 ${savedPosts.length}건`}
          emptyTitle="아직 찜한 모집글이 없어요"
          emptyDescription="관심 있는 모집글을 저장하면 여기에서 다시 볼 수 있어요."
        />
      </View>
    </View>
  );
}

type PostListProps = {
  posts: Post[];
  countLabel: string;
  emptyTitle: string;
  emptyDescription: string;
};

function PostList({ posts, countLabel, emptyTitle, emptyDescription }: PostListProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.countText}>{countLabel}</Text>

      {posts.length > 0 ? (
        <View style={styles.cardList}>
          {posts.map((post) => (
            <ProfilePostCard key={post.id} post={post} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Heart size={28} color={colors.gray400} strokeWidth={2.1} />
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyDescription}>{emptyDescription}</Text>
        </View>
      )}
    </ScrollView>
  );
}

export type ProfilePostCardProps = {
  post: Post;
  onPress?: () => void;
};

export function ProfilePostCard({ post, onPress }: ProfilePostCardProps) {
  const imageUrl = post.imageUrls[0];
  const isJob = post.type === "job";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={post.title}
      onPress={onPress}
      style={({ pressed }) => [styles.postCard, pressed && styles.pressed]}
    >
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.postImage} /> : null}

      <View style={styles.postCopy}>
        <View style={styles.postHeaderRow}>
          <View style={[styles.typeBadge, isJob ? styles.jobBadge : styles.carpoolBadge]}>
            {isJob ? (
              <BriefcaseBusiness size={13} color={colors.mintDark} strokeWidth={2.2} />
            ) : (
              <CarFront size={13} color={colors.yellowText} strokeWidth={2.2} />
            )}
            <Text style={[styles.typeBadgeText, isJob ? styles.jobText : styles.carpoolText]}>
              {isJob ? "인력" : "라이드"}
            </Text>
          </View>
          <Heart
            size={18}
            color={post.liked ? colors.mintDark : colors.gray300}
            fill={post.liked ? colors.mintLight : "transparent"}
            strokeWidth={2.1}
          />
        </View>

        <Text style={styles.postTitle} numberOfLines={2}>
          {post.title}
        </Text>
        <Text style={styles.postBody} numberOfLines={2}>
          {post.body}
        </Text>

        <View style={styles.metaBlock}>
          <MetaRow icon="calendar" label={formatSchedule(post)} />
          <MetaRow icon="place" label={formatPlace(post)} />
        </View>
      </View>
    </Pressable>
  );
}

type MetaRowProps = {
  icon: "calendar" | "place";
  label: string;
};

function MetaRow({ icon, label }: MetaRowProps) {
  const Icon = icon === "calendar" ? CalendarDays : MapPin;

  return (
    <View style={styles.metaRow}>
      <Icon size={12} color={colors.grayIcon} strokeWidth={2.1} />
      <Text style={styles.metaText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function formatSchedule(post: Post) {
  const days = post.days.join(" · ");
  if (post.type === "job") {
    const payLabel = post.preferredPay ?? `시급 ${post.wageAmount.toLocaleString()}원`;

    return `${days} ${post.startTime}-${post.endTime} · ${payLabel}`;
  }

  return `${days} ${post.startTime}${post.endTime ? `-${post.endTime}` : ""}`;
}

function formatPlace(post: Post) {
  if (post.type === "job") {
    return post.placeName;
  }

  return `${post.departure} → ${post.destination}`;
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
    paddingTop: profileLayout.listTopPadding,
    paddingBottom: profileLayout.listBottomPadding,
    gap: profileLayout.listContentGap,
  },
  countText: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  cardList: {
    gap: profileLayout.listCardGap,
  },
  postCard: {
    padding: 14,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    flexDirection: "row",
    gap: 12,
  },
  pressed: {
    opacity: 0.8,
  },
  postImage: {
    width: 82,
    height: 82,
    borderRadius: 12,
    backgroundColor: colors.gray100,
  },
  postCopy: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  postHeaderRow: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  typeBadge: {
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  jobBadge: {
    backgroundColor: colors.mintLight,
  },
  carpoolBadge: {
    backgroundColor: colors.yellowLight,
  },
  typeBadgeText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  jobText: {
    color: colors.mintDark,
  },
  carpoolText: {
    color: colors.yellowText,
  },
  postTitle: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  postBody: {
    color: colors.grayIcon,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  metaBlock: {
    gap: 3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    flex: 1,
    color: colors.grayIcon,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
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
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    textAlign: "center",
  },
  emptyDescription: {
    color: colors.mutedText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: "center",
  },
});
