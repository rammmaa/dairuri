import { Heart, Share2 } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "../../components/AppButton";
import { Header } from "../../components/Header";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { mockMe, mockPosts } from "../../data/mockDomain";
import { getMe, getPost, toggleLike as togglePostLike } from "../../services/api";
import { getSessionUser } from "../../services/authSession";
import type { JobPost, Post, UserProfile } from "../../types/domain";
import { ApplyFlowModal } from "./ApplyFlowModal";

export type PostDetailScreenProps = {
  postId: string;
  onBack?: () => void;
  onOpenChat?: () => void;
};

type MetaItem = {
  label: string;
  value: string;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=720";

export function PostDetailScreen({
  postId,
  onBack,
  onOpenChat,
}: PostDetailScreenProps) {
  const initialPost = useMemo(
    () =>
      process.env.NODE_ENV === "test"
        ? mockPosts.find((item) => item.id === postId) ?? mockPosts[0]
        : undefined,
    [postId],
  );
  const [post, setPost] = useState<Post | undefined>(initialPost);
  const [currentUser, setCurrentUser] = useState<UserProfile | undefined>(() =>
    process.env.NODE_ENV === "test" ? mockMe : getSessionUser(),
  );
  const [currentUserChecked, setCurrentUserChecked] = useState(
    process.env.NODE_ENV === "test" || Boolean(getSessionUser()),
  );
  const [applyVisible, setApplyVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return undefined;
    }

    let active = true;

    getPost(postId)
      .then((loadedPost) => {
        if (active && loadedPost) {
          setPost(loadedPost);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [postId]);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return undefined;
    }

    let active = true;

    getMe()
      .then((profile) => {
        if (active) {
          setCurrentUser(profile);
          setCurrentUserChecked(true);
        }
      })
      .catch(() => {
        if (active) {
          setCurrentUserChecked(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (!post) {
    return (
      <View style={styles.safeArea}>
        <Header showBack title="모집글" onBack={onBack} />
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>모집글을 불러오는 중이에요</Text>
        </View>
      </View>
    );
  }

  const isResourceProfile = post.type === "job" && post.profileMode === "resource";
  const title = post.type === "job" ? "인재 풀 등록" : "정기 라이딩";
  const themeColor = post.type === "job" ? colors.yellowText : colors.mintDark;
  const heroImage = post.imageUrls[0] ?? fallbackImage;
  const isOwnPost = currentUser?.id === post.author.id;
  const primaryActionDisabled = !currentUserChecked || !currentUser || isOwnPost;
  const primaryActionLabel = !currentUserChecked
    ? "확인 중"
    : isOwnPost
      ? "내 모집글"
      : isResourceProfile
        ? "연락하기"
        : "지원하기";

  const toggleLike = () => {
    const previousPost = post;
    setPost({ ...post, liked: !post.liked });

    togglePostLike(post.id)
      .then((updatedPost) => {
        if (updatedPost) {
          setPost(updatedPost);
        }
      })
      .catch(() => setPost(previousPost));
  };

  return (
    <View style={styles.safeArea}>
      <Header
        showBack
        title={title}
        onBack={onBack}
        right={<HeaderActions liked={post.liked} onLike={toggleLike} />}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image source={{ uri: heroImage }} style={styles.heroImage} />
        <View style={styles.content}>
          <AuthorRow post={post} themeColor={themeColor} />
          <Text style={styles.title}>{post.title}</Text>
          <MetaList post={post} themeColor={themeColor} />
          <View style={styles.bodySection}>
            <Text style={styles.sectionTitle}>상세 설명</Text>
            <Text style={styles.body}>{post.body}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={post.liked ? "찜 취소" : "찜하기"}
          onPress={toggleLike}
          style={({ pressed }) => [
            styles.footerHeart,
            post.liked && styles.footerHeartActive,
            pressed && styles.pressed,
          ]}
        >
          <Heart
            size={23}
            color={post.liked ? colors.mintDark : colors.grayIcon}
            fill={post.liked ? colors.mint : "transparent"}
            strokeWidth={2.1}
          />
        </Pressable>
        <View style={styles.footerActionColumn}>
          {isOwnPost ? (
            <Text style={styles.footerHint}>
              내가 작성한 모집글에는 지원할 수 없어요.
            </Text>
          ) : null}
          <AppButton
            label={primaryActionLabel}
            disabled={primaryActionDisabled}
            onPress={() => setApplyVisible(true)}
            variant={post.type === "job" ? "yellow" : "primary"}
            size="medium"
            style={styles.applyButton}
          />
        </View>
      </View>

      <ApplyFlowModal
        visible={applyVisible}
        post={post}
        onClose={() => setApplyVisible(false)}
        onOpenChat={onOpenChat}
      />
    </View>
  );
}

function HeaderActions({
  liked,
  onLike,
}: {
  liked: boolean;
  onLike: () => void;
}) {
  return (
    <View style={styles.headerActions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="공유하기"
        hitSlop={10}
        style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
      >
        <Share2 size={19} color={colors.grayIcon} strokeWidth={2.2} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={liked ? "찜 취소" : "찜하기"}
        hitSlop={10}
        onPress={onLike}
        style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
      >
        <Heart
          size={20}
          color={liked ? colors.mintDark : colors.grayIcon}
          fill={liked ? colors.mint : "transparent"}
          strokeWidth={2.2}
        />
      </Pressable>
    </View>
  );
}

function AuthorRow({ post, themeColor }: { post: Post; themeColor: string }) {
  return (
    <View style={styles.authorRow}>
      <View style={[styles.avatar, { borderColor: themeColor }]}>
        <Text style={styles.avatarInitial}>{post.author.nickname.slice(0, 1)}</Text>
      </View>
      <View style={styles.authorTextBox}>
        <Text style={styles.authorName}>{post.author.nickname}</Text>
        <Text style={styles.authorSub}>
          {post.author.area ?? "프로필 보기"} · {post.createdAt.slice(0, 10)}
        </Text>
      </View>
      <View style={styles.temperatureBadge}>
        <Text style={styles.temperature}>{post.author.temperature}°C</Text>
      </View>
    </View>
  );
}

function MetaList({ post, themeColor }: { post: Post; themeColor: string }) {
  const items = getMetaItems(post);

  return (
    <View style={styles.metaList}>
      {items.map((item) => (
        <View key={item.label} style={styles.metaRow}>
          <Text style={[styles.metaLabel, { color: themeColor }]}>{item.label}</Text>
          <Text style={styles.metaValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function getMetaItems(post: Post): MetaItem[] {
  const days = post.days.join(", ");

  if (post.type === "job") {
    if (post.profileMode === "resource") {
      return getResourceMetaItems(post, days);
    }

    return [
      { label: "활동 가능 지역", value: post.placeName },
      { label: "희망 급여", value: formatWage(post.wageType, post.wageAmount) },
      {
        label: "가능 시간",
        value: `${days} ${post.startTime} - ${post.endTime}`,
      },
      { label: "가능 업무", value: post.jobCategory ?? "인적 자원" },
    ];
  }

  return [
    { label: "출발장소", value: post.departure },
    { label: "도착장소", value: post.destination },
    {
      label: "출발시간",
      value: `${days} ${post.startTime}${post.endTime ? ` - ${post.endTime}` : ""}`,
    },
    { label: "비용", value: post.price ? `${post.price.toLocaleString()}원` : "협의" },
    { label: "모집인원", value: post.seats ? `${post.seats}명` : "협의" },
  ];
}

function getResourceMetaItems(post: JobPost, days: string): MetaItem[] {
  return [
    { label: "활동 가능 지역", value: post.placeName },
    {
      label: "희망 급여",
      value: post.preferredPay ?? formatWage(post.wageType, post.wageAmount),
    },
    {
      label: "가능 시간",
      value: `${days} ${post.startTime} - ${post.endTime}`,
    },
    {
      label: "가능 업무",
      value: post.availableTasks?.join(" · ") ?? post.jobCategory ?? "인적 자원",
    },
  ];
}

function formatWage(type: "hourly" | "monthly", amount: number) {
  const prefix = type === "hourly" ? "" : "월 ";

  return `${prefix}${amount.toLocaleString()}원`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  scrollContent: {
    paddingBottom: 104,
    backgroundColor: colors.surface,
  },
  heroImage: {
    width: "100%",
    height: 238,
    backgroundColor: colors.gray100,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 18,
    gap: 18,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.72,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: colors.gray50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  authorTextBox: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  authorSub: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
  },
  temperatureBadge: {
    minWidth: 54,
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: 14,
    backgroundColor: colors.yellowLight,
    alignItems: "center",
    justifyContent: "center",
  },
  temperature: {
    color: colors.yellowText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.bold,
  },
  title: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
  },
  metaList: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.gray50,
    gap: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  metaLabel: {
    width: 82,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.bold,
  },
  metaValue: {
    flex: 1,
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  bodySection: {
    gap: 8,
  },
  sectionTitle: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  body: {
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: 22,
    fontWeight: typography.weight.regular,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 76,
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerHeart: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  footerHeartActive: {
    borderColor: colors.mint,
    backgroundColor: colors.mintLight,
  },
  applyButton: {
    width: "100%",
  },
  footerActionColumn: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  footerHint: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
    textAlign: "center",
  },
});
