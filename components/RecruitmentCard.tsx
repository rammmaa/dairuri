import { BriefcaseBusiness, Clock3, Heart, Timer } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import type { MapHomePost } from "../data/mapHome";

export type RecruitmentCardProps = {
  post: MapHomePost;
  onPress?: (post: MapHomePost) => void;
};

export function RecruitmentCard({ post, onPress }: RecruitmentCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${post.title} 상세보기`}
      onPress={onPress ? () => onPress(post) : undefined}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.mainBlock}>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.author}>{post.author}</Text>
            <Text style={styles.title}>{post.title}</Text>
          </View>
          <Heart
            size={18}
            color={post.liked ? colors.mint : colors.lineStrong}
            fill={post.liked ? colors.mintLight : "transparent"}
            strokeWidth={2}
          />
        </View>

        <View style={styles.metaBlock}>
          <MetaRow color={colors.mintDark} icon={Clock3} label={post.schedule} />
          <MetaRow color={colors.grayIcon} icon={BriefcaseBusiness} label={post.purpose} />
          <MetaRow color={colors.grayIcon} icon={Timer} label={post.duration} />
        </View>
      </View>

      <View style={styles.originBlock}>
        <View style={styles.originRow}>
          <Text style={styles.originLabel}>{post.originLabel}</Text>
          <Text style={styles.originName}>{post.originName}</Text>
        </View>
        <Text style={styles.createdAgo}>{post.createdAgo}</Text>
      </View>
    </Pressable>
  );
}

type MetaRowProps = {
  color: string;
  icon: typeof Clock3;
  label: string;
};

function MetaRow({ color, icon: Icon, label }: MetaRowProps) {
  return (
    <View style={styles.metaRow}>
      <Icon size={11} color={color} strokeWidth={2.4} />
      <Text style={[styles.metaLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    gap: 10,
  },
  pressed: {
    opacity: 0.86,
  },
  mainBlock: {
    gap: 14,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  titleCopy: {
    flex: 1,
    gap: 8,
  },
  author: {
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  title: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  metaBlock: {
    gap: 3,
  },
  metaRow: {
    minHeight: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaLabel: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  originBlock: {
    gap: 3,
  },
  originRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  originLabel: {
    color: colors.yellowText,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  originName: {
    color: colors.grayIcon,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  createdAgo: {
    color: colors.mutedText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
});
