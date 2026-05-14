import {
  ArrowDownUp,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react-native";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";

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
  type CategoryFilter,
  type MapHomePost,
} from "../data/mapHome";
import {
  createPagedListState,
  filterAndSortMapPosts,
  type MapPostSortMode,
} from "../data/mapPostList";

export type ArchiveScreenProps = {
  onSelectTab?: (item: BottomNavItem) => void;
  onOpenPost?: (postId: string) => void;
};

const filterIcons = [CalendarDays, Clock3, MapPin] as const;
const POST_PAGE_SIZE = 3;
type DateFilter = MapHomePost["dateFilter"] | null;
type TimeFilter = MapHomePost["timeFilter"] | null;
type DepartureFilter = MapHomePost["departurePlace"] | null;

export function ArchiveScreen({ onSelectTab, onOpenPost }: ArchiveScreenProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter["id"] | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(null);
  const [departureFilter, setDepartureFilter] = useState<DepartureFilter>(null);
  const [sortMode, setSortMode] = useState<MapPostSortMode>("latest");
  const [visibleCount, setVisibleCount] = useState(POST_PAGE_SIZE);
  const filteredPosts = useMemo(() => {
    return filterAndSortMapPosts(mapHomePosts, {
      filters: {
        category: selectedCategory,
        date: dateFilter,
        time: timeFilter,
        departure: departureFilter,
      },
      sortMode,
    });
  }, [dateFilter, departureFilter, selectedCategory, sortMode, timeFilter]);
  const pagedPosts = createPagedListState(filteredPosts, {
    visibleCount,
    pageSize: POST_PAGE_SIZE,
  });
  const visiblePosts = pagedPosts.visibleItems;
  const hasMorePosts = pagedPosts.hasMore;

  useEffect(() => {
    setVisibleCount(POST_PAGE_SIZE);
  }, [dateFilter, departureFilter, selectedCategory, sortMode, timeFilter]);

  const cycleDateFilter = () => {
    setDateFilter((current) =>
      current === null ? "오늘" : current === "오늘" ? "내일" : null,
    );
  };
  const cycleTimeFilter = () => {
    setTimeFilter((current) =>
      current === null ? "오후" : current === "오후" ? "오전" : null,
    );
  };
  const toggleDepartureFilter = () => {
    setDepartureFilter((current) => (current === "남성현역" ? null : "남성현역"));
  };
  const cycleSortMode = () => {
    setSortMode((current) => (current === "latest" ? "oldest" : "latest"));
  };

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
            {categoryFilters.map((filter) => (
              <FilterChip
                key={filter.id}
                label={filter.label}
                selected={selectedCategory === filter.id}
                onPress={() =>
                  setSelectedCategory((current) =>
                    current === filter.id ? null : filter.id,
                  )
                }
                compact
                testID={`archive-category-${filter.id}`}
              />
            ))}
          </ScrollView>

          <View style={styles.filterPanel}>
            <View style={styles.filterRow}>
              {bottomSheetFilters.map((label, index) => {
                const isDate = label === "날짜";
                const isTime = label === "시간";
                const isDeparturePlace = label === "출발 장소";
                const selectedLabel = isDate
                  ? dateFilter
                  : isTime
                    ? timeFilter
                    : isDeparturePlace
                      ? departureFilter
                      : null;

                return (
                  <FilterChip
                    key={label}
                    label={selectedLabel ?? label}
                    icon={filterIcons[index]}
                    selected={selectedLabel !== null}
                    showChevron={selectedLabel === null}
                    showClose={selectedLabel !== null}
                    onPress={
                      isDate
                        ? cycleDateFilter
                        : isTime
                          ? cycleTimeFilter
                          : isDeparturePlace
                            ? toggleDepartureFilter
                            : undefined
                    }
                    compact
                    style={styles.filterChip}
                    testID={`archive-filter-${label}`}
                  />
                );
              })}
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.countRow}>
                <Text style={styles.countText}>총</Text>
                <Text style={styles.countNumber}>{filteredPosts.length}</Text>
                <Text style={styles.countText}>건</Text>
              </View>
              <FilterChip
                label={sortMode === "latest" ? "최신순" : "오래된순"}
                icon={ArrowDownUp}
                selected={sortMode === "oldest"}
                showChevron={sortMode === "latest"}
                showClose={sortMode === "oldest"}
                onPress={cycleSortMode}
                compact
                testID="archive-sort-filter"
              />
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardList}>
            {visiblePosts.length > 0 ? visiblePosts.map((post) => (
              <RecruitmentCard
                key={post.id}
                post={post}
                onPress={() => onOpenPost?.(post.detailPostId)}
              />
            )) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>조건에 맞는 모집글이 없어요</Text>
              </View>
            )}
            {hasMorePosts ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="모집글 더 보기"
                onPress={() =>
                  setVisibleCount(() => pagedPosts.nextVisibleCount)
                }
                testID="archive-load-more"
                style={({ pressed }) => [
                  styles.loadMoreButton,
                  pressed && styles.loadMorePressed,
                ]}
              >
                <Text style={styles.loadMoreText}>더 보기</Text>
              </Pressable>
            ) : null}
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
  emptyState: {
    minHeight: 120,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  loadMoreButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  loadMorePressed: {
    opacity: 0.82,
  },
  loadMoreText: {
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
});
