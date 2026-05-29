import { ChevronLeft, Clock3, Heart, Share2, UserRound } from "lucide-react-native";
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
import { screenTopInset } from "../../constants/safeArea";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { formatMannerTemperature } from "../../data/mannerTemperature";
import { mockMe, mockPosts } from "../../data/mockDomain";
import { getMe, getPost, toggleLike as togglePostLike } from "../../services/api";
import { getSessionUser } from "../../services/authSession";
import type { JobPost, Post, UserProfile } from "../../types/domain";
import { ApplyFlowModal } from "./ApplyFlowModal";

export type PostDetailScreenProps = {
  postId: string;
  onBack?: () => void;
  onOpenChat?: () => void;
  onSubmitted?: () => void;
};

type MetaItem = {
  label: string;
  value: string;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=720";
const DETAIL_HEADER_HEIGHT = 88 + screenTopInset;
const HERO_HEIGHT = 300;
const FOOTER_HEIGHT = 76;

export function PostDetailScreen({
  postId,
  onBack,
  onOpenChat,
  onSubmitted,
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

  const title = post.type === "job" ? "알바" : "라이딩";
  const themeColor = post.type === "job" ? colors.yellowText : colors.mintDark;
  const heroImage = post.imageUrls[0] ?? fallbackImage;
  const isOwnPost = currentUser?.id === post.author.id;
  const primaryActionDisabled = !currentUserChecked || !currentUser || isOwnPost;
  const primaryActionLabel = !currentUserChecked
      ? "확인 중"
      : isOwnPost
        ? "내 모집글"
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
      <DetailHeader
        title={title}
        liked={post.liked}
        onBack={onBack}
        onLike={toggleLike}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Image source={{ uri: heroImage }} style={styles.heroImage} />
        <View style={styles.content}>
          <AuthorRow post={post} themeColor={themeColor} />
          <View style={styles.divider} />
          <View style={styles.postSection}>
            <Text style={styles.postTitle}>{post.title}</Text>
            <View style={styles.postFacts}>
              <View style={styles.factItem}>
                <Clock3 size={14} color={colors.slate} strokeWidth={2.1} />
                <Text style={styles.factText}>{formatElapsedLabel(post.createdAt)}</Text>
              </View>
              <View style={styles.factItem}>
                <UserRound size={14} color={colors.slate} strokeWidth={2.1} />
                <Text style={styles.factText}>{getAvailabilityLabel(post)}</Text>
              </View>
            </View>
            <MetaList post={post} />
            <View style={styles.divider} />
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
            variant="primary"
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
        onReturnHome={onSubmitted}
      />
    </View>
  );
}

function DetailHeader({
  title,
  liked,
  onBack,
  onLike,
}: {
  title: string;
  liked: boolean;
  onBack?: () => void;
  onLike: () => void;
}) {
  return (
    <View style={styles.detailHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="뒤로 가기"
        hitSlop={10}
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <ChevronLeft size={24} color={colors.black} strokeWidth={2.3} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="공유하기"
        hitSlop={10}
        style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
      >
        <Share2 size={24} color={colors.black} strokeWidth={2.1} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={liked ? "찜 취소" : "찜하기"}
        hitSlop={10}
        onPress={onLike}
        style={({ pressed }) => [styles.headerHeartButton, pressed && styles.pressed]}
      >
        <Heart
          size={24}
          color={liked ? colors.red : colors.black}
          fill={liked ? colors.red : "transparent"}
          strokeWidth={2.2}
        />
      </Pressable>
    </View>
  );
}

function AuthorRow({ post, themeColor }: { post: Post; themeColor: string }) {
  const temperature = formatMannerTemperature(post.author.temperature);

  return (
    <View style={styles.authorRow}>
      <View style={[styles.avatar, { borderColor: themeColor }]}>
        {post.author.avatarUrl ? (
          <Image
            source={{ uri: post.author.avatarUrl }}
            style={styles.avatarImage}
            accessibilityLabel={`${post.author.nickname} 프로필 이미지`}
          />
        ) : (
          <Text style={styles.avatarInitial}>{post.author.nickname.slice(0, 1)}</Text>
        )}
      </View>
      <View style={styles.authorTextBox}>
        <Text style={styles.authorName}>{post.author.nickname}</Text>
        <Text style={styles.authorSub}>프로필 보기</Text>
      </View>
      <Text style={styles.temperature}>{temperature.value}</Text>
    </View>
  );
}

function MetaList({ post }: { post: Post }) {
  const items = getMetaItems(post);

  return (
    <View style={styles.metaList}>
      {items.map((item) => (
        <View key={item.label} style={styles.metaRow}>
          <Text style={styles.metaLabel}>{item.label}</Text>
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
      { label: "알바장소", value: post.placeName },
      { label: "시급", value: formatWage(post.wageType, post.wageAmount) },
      {
        label: "근로시간",
        value: `${days} ${post.startTime} - ${post.endTime}`,
      },
      { label: "카테고리", value: post.jobCategory ?? "학원/교육" },
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
    { label: "알바장소", value: post.placeName },
    {
      label: "시급",
      value: post.preferredPay ?? formatWage(post.wageType, post.wageAmount),
    },
    {
      label: "근로시간",
      value: `${days} ${post.startTime} - ${post.endTime}`,
    },
    {
      label: "카테고리",
      value: post.availableTasks?.join(" · ") ?? post.jobCategory ?? "인적 자원",
    },
  ];
}

function formatWage(type: "hourly" | "monthly", amount: number) {
  const prefix = type === "hourly" ? "" : "월 ";

  return `${prefix}${amount.toLocaleString()}원`;
}

function getAvailabilityLabel(post: Post) {
  if (post.type === "carpool") {
    return post.seats ? `${post.seats}명 지원가능` : "지원가능";
  }

  return "1명 지원가능";
}

function formatElapsedLabel(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();
  const now = Date.now();
  const diffMinutes = Math.max(1, Math.floor((now - createdTime) / 60_000));

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
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
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  scrollContent: {
    paddingTop: DETAIL_HEADER_HEIGHT - 25,
    paddingBottom: FOOTER_HEIGHT + 44,
    backgroundColor: colors.surface,
  },
  heroImage: {
    width: "100%",
    height: HERO_HEIGHT,
    backgroundColor: colors.gray100,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 18,
    gap: 22,
  },
  detailHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: DETAIL_HEADER_HEIGHT,
    paddingTop: screenTopInset + 39,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 32,
    height: 32,
    marginRight: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  shareButton: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerHeartButton: {
    width: 44,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.72,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1.5,
    backgroundColor: colors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  authorTextBox: {
    flex: 1,
    gap: 3,
  },
  authorName: {
    color: colors.black,
    fontFamily: typography.family.semibold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  authorSub: {
    color: colors.slate,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textDecorationLine: "underline",
  },
  temperature: {
    color: colors.yellowText,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lineStrong,
  },
  postSection: {
    gap: 19,
  },
  postTitle: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
  },
  postFacts: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  factItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  factText: {
    color: colors.slate,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  metaList: {
    gap: 17,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 21,
  },
  metaLabel: {
    width: 59,
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  metaValue: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  body: {
    color: colors.black,
    fontFamily: typography.family.medium,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.title,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: FOOTER_HEIGHT,
    paddingHorizontal: 22,
    paddingTop: 15,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 22,
  },
  footerHeart: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
    alignItems: "center",
    justifyContent: "center",
  },
  footerHeartActive: {
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
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    textAlign: "center",
  },
});
