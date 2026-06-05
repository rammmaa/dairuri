import type {
  CategoryFilter,
  MapHomePost,
  TimeFilter,
  WeekdayFilter,
} from "./mapHome";

export type MapPostFilters = {
  category?: CategoryFilter["id"] | null;
  days?: readonly WeekdayFilter[] | null;
  times?: readonly TimeFilter[] | null;
};

export type MapPostSortMode = "default" | "latest" | "oldest";

export type MapPostListOptions = {
  filters: MapPostFilters;
  sortMode: MapPostSortMode;
};

export type PagedListState<T> = {
  totalCount: number;
  visibleItems: T[];
  hasMore: boolean;
  nextVisibleCount: number;
  resetVisibleCount: number;
};

export function filterAndSortMapPosts(
  posts: readonly MapHomePost[],
  { filters, sortMode }: MapPostListOptions,
) {
  const selectedDays = filters.days ?? [];
  const selectedTimes = filters.times ?? [];

  const filteredPosts = posts.filter((post) => {
    if (filters.category && post.category !== filters.category) {
      return false;
    }

    if (
      selectedDays.length > 0 &&
      !post.dayFilters.some((day) => selectedDays.includes(day))
    ) {
      return false;
    }

    if (
      selectedTimes.length > 0 &&
      !selectedTimes.includes(post.timeFilter)
    ) {
      return false;
    }

    return true;
  });

  return [...filteredPosts].sort((a, b) =>
    sortMode === "oldest"
      ? b.createdMinutesAgo - a.createdMinutesAgo
      : a.createdMinutesAgo - b.createdMinutesAgo,
  );
}

export function createPagedListState<T>(
  items: readonly T[],
  {
    visibleCount,
    pageSize,
  }: {
    visibleCount: number;
    pageSize: number;
  },
): PagedListState<T> {
  const safePageSize = Math.max(1, pageSize);
  const safeVisibleCount = Math.max(safePageSize, visibleCount);
  const clampedVisibleCount = Math.min(safeVisibleCount, items.length);

  return {
    totalCount: items.length,
    visibleItems: items.slice(0, clampedVisibleCount),
    hasMore: clampedVisibleCount < items.length,
    nextVisibleCount: Math.min(clampedVisibleCount + safePageSize, items.length),
    resetVisibleCount: safePageSize,
  };
}
