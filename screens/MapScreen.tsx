import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Location from "expo-location";
import {
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from "react-native";
import { Bus, MapPin, Search, X } from "lucide-react-native";

import { BottomNav } from "../components/BottomNav";
import { CurrentLocationIcon } from "../components/CurrentLocationIcon";
import { FilterChip } from "../components/FilterChip";
import { MapPreview } from "../components/MapPreview";
import type {
  MapPreviewCamera,
  MapPreviewMarker,
} from "../components/mapPreviewData";
import { RecruitmentCard } from "../components/RecruitmentCard";
import { colors } from "../constants/colors";
import {
  getSafeAreaBottomInset,
  useRuntimeSafeAreaInsets,
} from "../constants/safeArea";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import {
  bottomNavItems,
  categoryFilters,
  mapDomainPostsToMapHomePosts,
  mapHomePosts,
  timeFilterOptions,
  weekdayFilterOptions,
  type CategoryFilter,
  type BottomNavItem,
  type MapHomePost,
  type TimeFilter,
  type WeekdayFilter,
} from "../data/mapHome";
import {
  createPagedListState,
  filterAndSortMapPosts,
  type MapPostSortMode,
} from "../data/mapPostList";
import { getPosts } from "../services/api";
import { searchPlaceCandidates } from "../services/places";
import type { PlaceCandidate } from "../types/place";

export type MapScreenProps = {
  onSelectTab?: (item: BottomNavItem) => void;
  onOpenPost?: (postId: string) => void;
  onSearchPress?: () => void;
  onCurrentLocationPress?: () => void;
  onSelectMapMarker?: (markerId: string) => void;
};

const SHEET_DEFAULT_TOP = 486;
const SHEET_EXPANDED_TOP = 300;
const BUS_ARCHIVE_SHEET_EXPANDED_TOP = 56;
const SHEET_COLLAPSED_TOP = 560;
const POST_PAGE_SIZE = 2;
const BUS_ARCHIVE_UNKNOWN_LOCATION_LABEL = "확인 중";
const BUS_ARCHIVE_CURRENT_LOCATION_LABEL = "현재 위치";
const BUS_ARCHIVE_ROUTE_FONT_SIZE = 48;
const BUS_ARCHIVE_ROUTE_LINE_HEIGHT = 56;
type BusSighting = {
  id: string;
  timeLabel: string;
  locationLabel: string;
};

function clampSheetTop(top: number, expandedTop = SHEET_EXPANDED_TOP) {
  return Math.min(SHEET_COLLAPSED_TOP, Math.max(expandedTop, top));
}

function formatBusArchiveClock(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds(),
  )}`;
}

function toggleFilterValue<T extends string>(
  values: readonly T[],
  value: T,
): T[] {
  return values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value];
}

function mapPostsToPreviewMarkers(
  posts: readonly MapHomePost[],
): MapPreviewMarker[] {
  const markersById = new Map<string, MapPreviewMarker>();

  for (const post of posts) {
    if (!post.marker) {
      continue;
    }

    const markerId = `${post.category}-${post.detailPostId}`;
    if (markersById.has(markerId)) {
      continue;
    }

    markersById.set(markerId, {
      id: markerId,
      label: post.title,
      latitude: post.marker.latitude,
      longitude: post.marker.longitude,
    });
  }

  return [...markersById.values()];
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
  const [selectedDays, setSelectedDays] = useState<WeekdayFilter[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<TimeFilter[]>([]);
  const [sortMode, setSortMode] = useState<MapPostSortMode>("default");
  const [visibleCount, setVisibleCount] = useState(POST_PAGE_SIZE);
  const [sheetTop, setSheetTop] = useState(SHEET_DEFAULT_TOP);
  const [focusedCamera, setFocusedCamera] = useState<MapPreviewCamera | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceCandidate[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [busClockDate, setBusClockDate] = useState(() => new Date());
  const [busSightings, setBusSightings] = useState<BusSighting[]>([]);
  const [busArchiveLocationLabel, setBusArchiveLocationLabel] = useState(
    BUS_ARCHIVE_UNKNOWN_LOCATION_LABEL,
  );
  const bottomInset = getSafeAreaBottomInset(useRuntimeSafeAreaInsets());
  const [recruitmentPosts, setRecruitmentPosts] = useState<MapHomePost[]>(() =>
    process.env.NODE_ENV === "test" ? mapHomePosts : [],
  );
  const sheetTopRef = useRef(SHEET_DEFAULT_TOP);
  const dragStartTopRef = useRef(SHEET_DEFAULT_TOP);
  const isBusArchiveMode = selectedCategory === "bus";
  const busClockLabel = useMemo(
    () => formatBusArchiveClock(busClockDate),
    [busClockDate],
  );
  const filteredPosts = useMemo(() => {
    return filterAndSortMapPosts(recruitmentPosts, {
      filters: {
        category: selectedCategory,
        days: selectedDays,
        times: selectedTimes,
      },
      sortMode,
    });
  }, [
    recruitmentPosts,
    selectedCategory,
    selectedDays,
    selectedTimes,
    sortMode,
  ]);
  const pagedPosts = createPagedListState(filteredPosts, {
    visibleCount,
    pageSize: POST_PAGE_SIZE,
  });
  const visiblePosts = pagedPosts.visibleItems;
  const hasMorePosts = pagedPosts.hasMore;
  const mapMarkers = useMemo(
    () => mapPostsToPreviewMarkers(filteredPosts),
    [filteredPosts],
  );

  useEffect(() => {
    setVisibleCount(POST_PAGE_SIZE);
  }, [selectedCategory, selectedDays, selectedTimes, sortMode]);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return undefined;
    }

    let active = true;

    getPosts()
      .then((posts) => {
        if (active) {
          setRecruitmentPosts(mapDomainPostsToMapHomePosts(posts));
        }
      })
      .catch(() => {
        if (active) {
          setRecruitmentPosts([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!searchOpen) {
      return undefined;
    }

    const trimmedQuery = searchQuery.trim();
    let active = true;

    if (trimmedQuery.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return () => {
        active = false;
      };
    }

    setSearchLoading(true);
    setSearchError(null);

    searchPlaceCandidates(trimmedQuery)
      .then((places) => {
        if (!active) {
          return;
        }
        setSearchResults(places);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setSearchResults([]);
        setSearchError("지도 검색에 실패했어요.");
      })
      .finally(() => {
        if (active) {
          setSearchLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [searchOpen, searchQuery]);

  const toggleDayFilter = (day: WeekdayFilter) => {
    setSelectedDays((current) => toggleFilterValue(current, day));
  };
  const toggleTimeFilter = (time: TimeFilter) => {
    setSelectedTimes((current) => toggleFilterValue(current, time));
  };
  const cycleSortMode = () => {
    setSortMode((current) =>
      current === "default" ? "latest" : current === "latest" ? "oldest" : "default",
    );
  };
  const updateSheetTop = useCallback((nextTop: number, expandedTop?: number) => {
    const clampedTop = clampSheetTop(nextTop, expandedTop);

    sheetTopRef.current = clampedTop;
    setSheetTop(clampedTop);
  }, []);
  const toggleCategoryFilter = useCallback(
    (filterId: CategoryFilter["id"]) => {
      const nextFilter = selectedCategory === filterId ? null : filterId;

      setSelectedCategory(nextFilter);

      if (nextFilter === "bus") {
        updateSheetTop(
          BUS_ARCHIVE_SHEET_EXPANDED_TOP,
          BUS_ARCHIVE_SHEET_EXPANDED_TOP,
        );
      }
    },
    [selectedCategory, updateSheetTop],
  );
  const applyFocusedLocation = useCallback((coords: {
    latitude: number;
    longitude: number;
  }) => {
    setFocusedCamera({
      latitude: coords.latitude,
      longitude: coords.longitude,
      zoom: 16,
    });
    setBusArchiveLocationLabel(BUS_ARCHIVE_CURRENT_LOCATION_LABEL);
  }, []);
  const readCurrentLocation = useCallback(async () => {
    const geolocation = globalThis.navigator?.geolocation;

    if (geolocation) {
      return new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
        geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          () => resolve(null),
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 30000,
          },
        );
      });
    }

    const permission = await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      return null;
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  }, []);
  const handleCurrentLocationPress = useCallback(async () => {
    onCurrentLocationPress?.();

    try {
      const coords = await readCurrentLocation();
      if (coords) {
        applyFocusedLocation(coords);
      }
    } catch {
      return;
    }
  }, [applyFocusedLocation, onCurrentLocationPress, readCurrentLocation]);
  const handleBusSightingSave = useCallback(() => {
    const now = new Date();
    const timeLabel = formatBusArchiveClock(now);
    const locationLabel = busArchiveLocationLabel;

    setBusClockDate(now);
    setBusSightings((current) => [
      {
        id: `${now.getTime()}-${current.length}`,
        timeLabel,
        locationLabel,
      },
      ...current,
    ]);
  }, [busArchiveLocationLabel]);

  const selectSearchResult = useCallback((place: PlaceCandidate) => {
    setFocusedCamera({
      latitude: place.latitude,
      longitude: place.longitude,
      zoom: 16,
    });
    setSearchQuery(place.name);
    setSearchOpen(false);
  }, []);

  useEffect(() => {
    if (!isBusArchiveMode) {
      return undefined;
    }

    setBusClockDate(new Date());

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const refreshClock = () => {
      setBusClockDate(new Date());
      timeoutId = setTimeout(refreshClock, 1000);
    };

    timeoutId = setTimeout(refreshClock, 1000);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isBusArchiveMode]);

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
          updateSheetTop(
            dragStartTopRef.current + gestureState.dy,
            isBusArchiveMode
              ? BUS_ARCHIVE_SHEET_EXPANDED_TOP
              : SHEET_EXPANDED_TOP,
          );
        },
      }),
    [isBusArchiveMode, updateSheetTop],
  );

  return (
    <View style={styles.safeArea}>
      <View style={styles.screen}>
        <MapPreview
          style={styles.mapPreview}
          camera={focusedCamera ?? undefined}
          markers={mapMarkers}
          onMarkerPress={onSelectMapMarker}
        />

        <View style={styles.topOverlay}>
          {searchOpen ? (
            <View style={styles.searchPanel}>
              <View style={styles.searchInputRow}>
                <Search size={20} color={colors.grayIcon} strokeWidth={2.2} />
                <TextInput
                  autoFocus
                  placeholder="장소 검색"
                  placeholderTextColor={colors.mutedText}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  testID="map-home-search-input"
                  style={styles.searchInput}
                  onSubmitEditing={() => {
                    const firstPlace = searchResults[0];
                    if (firstPlace) {
                      selectSearchResult(firstPlace);
                    }
                  }}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="지도 검색 닫기"
                  hitSlop={8}
                  onPress={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                    setSearchResults([]);
                    setSearchError(null);
                  }}
                >
                  <X size={19} color={colors.grayIcon} strokeWidth={2.3} />
                </Pressable>
              </View>
              {searchLoading ? (
                <Text style={styles.searchHelperText}>검색 중이에요.</Text>
              ) : searchError ? (
                <Text style={styles.searchErrorText}>{searchError}</Text>
              ) : searchQuery.trim().length >= 2 && searchResults.length === 0 ? (
                <Text style={styles.searchHelperText}>검색 결과가 없어요.</Text>
              ) : null}
              {searchResults.slice(0, 3).map((place) => (
                <Pressable
                  key={place.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${place.name} 지도 이동`}
                  testID={`map-home-search-result-${place.id}`}
                  onPress={() => selectSearchResult(place)}
                  style={({ pressed }) => [
                    styles.searchResultRow,
                    pressed && styles.searchResultPressed,
                  ]}
                >
                  <MapPin size={15} color={colors.mintDark} strokeWidth={2.3} />
                  <View style={styles.searchResultCopy}>
                    <Text style={styles.searchResultName} numberOfLines={1}>
                      {place.name}
                    </Text>
                    <Text style={styles.searchResultAddress} numberOfLines={1}>
                      {place.address}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="지도 검색"
              onPress={() => {
                onSearchPress?.();
                setSearchOpen(true);
              }}
              testID="map-home-search-button"
              style={({ pressed }) => [
                styles.searchBar,
                pressed && styles.searchBarPressed,
              ]}
            >
              <MapPin size={26} color={colors.mint} fill={colors.mint} />
              <Text style={styles.searchPlaceholder}>여기서 검색</Text>
            </Pressable>
          )}

          <View style={styles.categoryRow}>
            {categoryFilters.map((filter) => (
              <FilterChip
                key={filter.id}
                label={filter.label}
                icon={CurrentLocationIcon}
                iconTestID="category-current-location-icon"
                selected={selectedCategory === filter.id}
                onPress={() => toggleCategoryFilter(filter.id)}
                testID={`map-home-category-${filter.id}`}
              />
            ))}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="현재 위치로 이동"
          onPress={handleCurrentLocationPress}
          testID="map-home-current-location-button"
          style={styles.locationButton}
        >
          <CurrentLocationIcon size={20} color={colors.grayIcon} />
        </Pressable>

        <View
          testID="map-home-bottom-sheet"
          style={[
            styles.bottomSheet,
            { top: sheetTop, bottom: spacing.navHeight + bottomInset },
          ]}
        >
          {isBusArchiveMode ? (
            <View
              style={styles.busArchiveSheet}
              testID="map-home-bus-archive-panel"
            >
              <View
                {...sheetPanResponder.panHandlers}
                accessibilityRole="adjustable"
                accessibilityLabel="버스 기록 패널 이동 핸들"
                testID="map-home-sheet-drag-handle"
                style={styles.dragHandleTouchArea}
              >
                <View style={styles.handle} />
              </View>

              <View style={styles.busArchiveContent}>
                <Text style={styles.busArchiveTitle}>방금 버스 봤어요!</Text>
                <Text style={styles.busArchiveTime}>{busClockLabel}</Text>
                <View style={styles.busLocationPill}>
                  <View style={styles.busLocationDot} />
                  <Text style={styles.busLocationText}>
                    현위치: {busArchiveLocationLabel}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="버스 목격 기록하기"
                  onPress={handleBusSightingSave}
                  testID="map-home-bus-sighting-save"
                  style={({ pressed }) => [
                    styles.busSaveButton,
                    pressed && styles.busSaveButtonPressed,
                  ]}
                >
                  <Bus size={44} color={colors.blue} strokeWidth={2.2} />
                </Pressable>

                <Text style={styles.busArchiveHint}>
                  버튼을 누르면,{"\n"}현재 시각과 위치가 즉시 저장됩니다.
                </Text>

                {busSightings.length > 0 ? (
                  <View
                    style={styles.busSightingsList}
                    testID="map-home-bus-sighting-list"
                  >
                    <Text style={styles.busSightingsTitle}>최근 기록</Text>
                    {busSightings.slice(0, 3).map((sighting) => (
                      <Text key={sighting.id} style={styles.busSightingItem}>
                        {sighting.timeLabel} · {sighting.locationLabel}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          ) : (
            <>
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
                <View style={styles.sheetFilterGroups}>
                  <View style={styles.sheetFilterRow}>
                    <Text style={styles.filterGroupLabel}>요일</Text>
                    {weekdayFilterOptions.map((day) => (
                      <FilterChip
                        key={day}
                        label={day}
                        selected={selectedDays.includes(day)}
                        compact
                        onPress={() => toggleDayFilter(day)}
                        testID={`map-home-day-filter-${day}`}
                      />
                    ))}
                  </View>
                  <View style={styles.sheetFilterRow}>
                    <Text style={styles.filterGroupLabel}>시간</Text>
                    {timeFilterOptions.map((time) => (
                      <FilterChip
                        key={time}
                        label={time}
                        selected={selectedTimes.includes(time)}
                        compact
                        onPress={() => toggleTimeFilter(time)}
                        testID={`map-home-time-filter-${time}`}
                      />
                    ))}
                  </View>
                </View>
              </View>

              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetContent}
                showsVerticalScrollIndicator={false}
                testID="map-home-sheet-scroll"
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

                <View style={styles.cardList} testID="map-home-card-list">
                  {visiblePosts.length > 0 ? visiblePosts.map((post) => (
                    <RecruitmentCard
                      key={post.id}
                      post={post}
                      onPress={() => onOpenPost?.(post.detailPostId)}
                      testID={`recruitment-card-${post.id}`}
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
            </>
          )}
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
    shadowColor: colors.black,
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
    fontFamily: typography.family.regular,
  },
  searchPanel: {
    borderRadius: 24,
    backgroundColor: colors.surface,
    padding: 10,
    gap: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInputRow: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    paddingVertical: 0,
  },
  searchHelperText: {
    paddingHorizontal: 12,
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  searchErrorText: {
    paddingHorizontal: 12,
    color: colors.red,
    fontFamily: typography.family.medium,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  searchResultRow: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchResultPressed: {
    backgroundColor: colors.mintLight,
  },
  searchResultCopy: {
    flex: 1,
    minWidth: 0,
  },
  searchResultName: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  searchResultAddress: {
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
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
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: colors.homeListBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  sheetFilterBar: {
    height: 116,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 28,
    paddingBottom: 10,
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
  sheetFilterGroups: {
    width: "100%",
    alignItems: "center",
    gap: 7,
  },
  sheetFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  filterGroupLabel: {
    width: 32,
    color: colors.grayText,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    textAlign: "center",
  },
  sheetScroll: {
    flex: 1,
    backgroundColor: colors.homeListBackground,
  },
  sheetContent: {
    paddingHorizontal: spacing.screenX,
    paddingTop: spacing.homeListPaddingTop,
    paddingBottom: spacing.homeListPaddingBottom,
  },
  busArchiveSheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  busArchiveContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.screenX,
    paddingTop: 34,
    paddingBottom: 18,
  },
  busArchiveTitle: {
    color: colors.blue,
    fontFamily: typography.family.regular,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
    textAlign: "center",
  },
  busArchiveTime: {
    marginTop: 12,
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: BUS_ARCHIVE_ROUTE_FONT_SIZE,
    lineHeight: BUS_ARCHIVE_ROUTE_LINE_HEIGHT,
    textAlign: "center",
  },
  busLocationPill: {
    minHeight: 54,
    marginTop: 12,
    paddingHorizontal: 26,
    borderRadius: 27,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  busLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.blue,
  },
  busLocationText: {
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  busSaveButton: {
    width: "100%",
    maxWidth: 292,
    height: 112,
    marginTop: 28,
    borderRadius: 28,
    backgroundColor: colors.grayText,
    alignItems: "center",
    justifyContent: "center",
  },
  busSaveButtonPressed: {
    opacity: 0.8,
  },
  busArchiveHint: {
    marginTop: 20,
    color: colors.gray400,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: 24,
    textAlign: "center",
  },
  busSightingsList: {
    width: "100%",
    maxWidth: 292,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.gray50,
  },
  busSightingsTitle: {
    color: colors.slate,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  busSightingItem: {
    marginTop: 4,
    color: colors.grayIcon,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
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
    fontFamily: typography.family.regular,
  },
  countNumber: {
    color: colors.mintDark,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontFamily: typography.family.regular,
  },
  cardList: {
    gap: spacing.homeListGap,
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
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
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
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
});
