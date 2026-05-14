import {
  ArrowDownUp,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BottomNav } from "../components/BottomNav";
import { FilterChip } from "../components/FilterChip";
import { RecruitmentCard } from "../components/RecruitmentCard";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import {
  bottomNavItems,
  bottomSheetFilters,
  categoryFilters,
  mapHomePosts,
  type BottomNavItem,
} from "../data/mapHome";

export type ArchiveScreenProps = {
  onSelectTab?: (item: BottomNavItem) => void;
  onOpenPost?: (postId: string) => void;
};

const filterIcons = [CalendarDays, Clock3, MapPin] as const;

export function ArchiveScreen({ onSelectTab, onOpenPost }: ArchiveScreenProps) {
  return (
    <View style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>다로리 모집 아카이브</Text>
            <Text style={styles.title}>모집글</Text>
          </View>

          <View style={styles.headerAction} accessibilityRole="button">
            <SlidersHorizontal size={20} color={colors.grayIcon} strokeWidth={2.3} />
          </View>
        </View>

        <View style={styles.actionArea}>
          <View style={styles.searchBar} accessibilityRole="search">
            <Search size={19} color={colors.grayText} strokeWidth={2.3} />
            <Text style={styles.searchPlaceholder}>모집글 검색</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {categoryFilters.map((filter, index) => (
              <FilterChip
                key={filter.id}
                label={filter.label}
                selected={index === 0}
                compact
              />
            ))}
          </ScrollView>

          <View style={styles.filterPanel}>
            <View style={styles.filterRow}>
              {bottomSheetFilters.map((label, index) => (
                <FilterChip
                  key={label}
                  label={label}
                  icon={filterIcons[index]}
                  showChevron
                  compact
                  style={styles.filterChip}
                />
              ))}
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.countRow}>
                <Text style={styles.countText}>총</Text>
                <Text style={styles.countNumber}>{mapHomePosts.length}</Text>
                <Text style={styles.countText}>건</Text>
              </View>
              <FilterChip label="최신순" icon={ArrowDownUp} showChevron compact />
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardList}>
            {mapHomePosts.map((post) => (
              <RecruitmentCard
                key={post.id}
                post={post}
                onPress={() => onOpenPost?.(post.detailPostId)}
              />
            ))}
          </View>
        </ScrollView>

        <BottomNav
          items={bottomNavItems}
          selectedId="posts"
          onSelect={onSelectTab}
          testID="archive-bottom-nav"
        />
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
    backgroundColor: colors.bg,
    overflow: "hidden",
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: spacing.screenX,
    paddingBottom: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
  },
  kicker: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
  },
  title: {
    marginTop: 3,
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: typography.weight.bold,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  actionArea: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
  },
  searchBar: {
    height: spacing.inputHeight,
    paddingHorizontal: 16,
    borderRadius: spacing.inputHeight / 2,
    backgroundColor: colors.sheet,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  searchPlaceholder: {
    color: colors.mutedText,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.regular,
  },
  categoryRow: {
    paddingTop: 10,
    paddingBottom: 12,
    gap: 7,
  },
  filterPanel: {
    padding: 12,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    gap: 12,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterChip: {
    flex: 1,
    minWidth: 0,
  },
  summaryRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  countText: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.regular,
  },
  countNumber: {
    color: colors.mintDark,
    fontFamily: typography.family.body,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
  },
  listScroll: {
    flex: 1,
    backgroundColor: colors.sheet,
  },
  listContent: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 14,
    paddingBottom: spacing.navHeight + 22,
  },
  cardList: {
    gap: 8,
  },
});
