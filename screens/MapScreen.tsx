import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { MapPin } from "lucide-react-native";

import { BottomNav } from "../components/BottomNav";
import { CurrentLocationIcon } from "../components/CurrentLocationIcon";
import { FilterChip } from "../components/FilterChip";
import { MapPreview } from "../components/MapPreview";
import { RecruitmentCard } from "../components/RecruitmentCard";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import {
  bottomNavItems,
  bottomSheetFilters,
  categoryFilters,
  mapHomePosts,
  type CategoryFilter,
  type BottomNavItem,
  type MapHomePost,
} from "../data/mapHome";
import {
  createPagedListState,
  filterAndSortMapPosts,
  type MapPostSortMode,
} from "../data/mapPostList";

export type MapScreenProps = {
  onSelectTab?: (item: BottomNavItem) => void;
  onOpenPost?: (postId: string) => void;
  onSearchPress?: () => void;
  onCurrentLocationPress?: () => void;
  onSelectMapMarker?: (markerId: string) => void;
};

const SHEET_DEFAULT_TOP = 486;
const SHEET_EXPANDED_TOP = 300;
const SHEET_COLLAPSED_TOP = 560;
const POST_PAGE_SIZE = 2;
type DateFilter = MapHomePost["dateFilter"] | null;
type TimeFilter = MapHomePost["timeFilter"] | null;
type DepartureFilter = MapHomePost["departurePlace"] | null;

function clampSheetTop(top: number) {
  return Math.min(SHEET_COLLAPSED_TOP, Math.max(SHEET_EXPANDED_TOP, top));
}

export function MapScreen({
  onSelectTab,
  onOpenPost,
  onSearchPress,
  onCurrentLocationPress,
  onSelectMapMarker,
}: MapScreenProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter["id"] | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(null);
  const [departureFilter, setDepartureFilter] = useState<DepartureFilter>(null);
  const [sortMode, setSortMode] = useState<MapPostSortMode>("default");
  const [visibleCount, setVisibleCount] = useState(POST_PAGE_SIZE);
  const [sheetTop, setSheetTop] = useState(SHEET_DEFAULT_TOP);
  const sheetTopRef = useRef(SHEET_DEFAULT_TOP);
  const dragStartTopRef = useRef(SHEET_DEFAULT_TOP);
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
    setSortMode((current) =>
      current === "default" ? "latest" : current === "latest" ? "oldest" : "default",
    );
  };
  const updateSheetTop = useCallback((nextTop: number) => {
    const clampedTop = clampSheetTop(nextTop);

    sheetTopRef.current = clampedTop;
    setSheetTop(clampedTop);
  }, []);
  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 2,
        onPanResponderGrant: () => {
          dragStartTopRef.current = sheetTopRef.current;
        },
        onPanResponderMove: (_, gestureState) => {
          updateSheetTop(dragStartTopRef.current + gestureState.dy);
        },
      }),
    [updateSheetTop],
  );

  return (
    <View style={styles.safeArea}>
      <View style={styles.screen}>
        <MapPreview style={styles.mapPreview} onMarkerPress={onSelectMapMarker} />

        <View style={styles.topOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="지도 검색"
            onPress={onSearchPress}
            testID="map-home-search-button"
            style={({ pressed }) => [
              styles.searchBar,
              pressed && styles.searchBarPressed,
            ]}
          >
            <MapPin size={26} color={colors.mint} fill={colors.mint} />
            <Text style={styles.searchPlaceholder}>여기서 검색</Text>
          </Pressable>

          <View style={styles.categoryRow}>
            {categoryFilters.map((filter) => (
              <FilterChip
                key={filter.id}
                label={filter.label}
                icon={CurrentLocationIcon}
                iconTestID="category-current-location-icon"
                selected={selectedCategory === filter.id}
                onPress={() =>
                  setSelectedCategory((current) =>
                    current === filter.id ? null : filter.id,
                  )
                }
                testID={`map-home-category-${filter.id}`}
              />
            ))}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="현재 위치로 이동"
          onPress={onCurrentLocationPress}
          testID="map-home-current-location-button"
          style={styles.locationButton}
        >
          <CurrentLocationIcon size={20} color={colors.grayIcon} />
        </Pressable>

        <View
          testID="map-home-bottom-sheet"
          style={[styles.bottomSheet, { top: sheetTop }]}
        >
          <View style={styles.sheetFilterBar}>
            <View
              {...sheetPanResponder.panHandlers}
              accessibilityRole="adjustable"
              accessibilityLabel="모집글 패널 이동 핸들"
              testID="map-home-sheet-drag-handle"
              style={styles.dragHandleTouchArea}
            >
              <View style={styles.handle} />
            </View>
            <View style={styles.sheetFilterRow}>
              {bottomSheetFilters.map((label) => {
                const isDeparturePlace = label === "출발 장소";
                const isDate = label === "날짜";
                const isTime = label === "시간";
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
                    testID={`map-home-filter-${label}`}
                  />
                );
              })}
            </View>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.listHeader}>
              <View style={styles.countRow}>
                <Text style={styles.countText}>총</Text>
                <Text style={styles.countNumber}>{filteredPosts.length}</Text>
                <Text style={styles.countText}>건</Text>
              </View>
              <FilterChip
                label={
                  sortMode === "latest"
                    ? "최신순"
                    : sortMode === "oldest"
                      ? "오래된순"
                      : "정렬조건"
                }
                selected={sortMode !== "default"}
                showChevron={sortMode === "default"}
                showClose={sortMode !== "default"}
                compact
                onPress={cycleSortMode}
                testID="map-home-sort-filter"
              />
            </View>

            <View style={styles.cardList}>
              {visiblePosts.length > 0 ? visiblePosts.map((post) => (
                <RecruitmentCard
                  key={post.id}
                  post={post}
                  onPress={() => onOpenPost?.(post.detailPostId)}
                />
              )) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>조건에 맞는 모집글이 없어요</Text>
                </View>
              )}
              {hasMorePosts ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="모집글 더 보기"
                  onPress={() =>
                    setVisibleCount(() => pagedPosts.nextVisibleCount)
                  }
                  testID="map-home-load-more"
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
        </View>

        <BottomNav
          items={bottomNavItems}
          selectedId="map"
          onSelect={onSelectTab}
          testID="map-home-bottom-nav"
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
  mapPreview: {
    height: 540,
  },
  topOverlay: {
    position: "absolute",
    top: 49,
    left: 13,
    right: 13,
  },
  searchBar: {
    height: 56,
    paddingLeft: 16,
    paddingRight: 18,
    borderRadius: 28,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchBarPressed: {
    opacity: 0.86,
  },
  searchPlaceholder: {
    color: colors.mutedText,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.regular,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  locationButton: {
    position: "absolute",
    top: 422,
    right: 13,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: spacing.navHeight,
    backgroundColor: colors.sheet,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  sheetFilterBar: {
    height: 80,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 14,
  },
  dragHandleTouchArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    alignItems: "center",
    paddingTop: 8,
    zIndex: 1,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.stone,
  },
  sheetFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 14,
    paddingBottom: 22,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  countText: {
    color: colors.black,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.regular,
  },
  countNumber: {
    color: colors.mintDark,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.regular,
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
  emptyTitle: {
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
