import type { CategoryFilter, MapHomePost } from "./mapHome";

export type MapPostFilters = {
  category?: CategoryFilter["id"] | null;
  date?: MapHomePost["dateFilter"] | null;
  time?: MapHomePost["timeFilter"] | null;
  departure?: MapHomePost["departurePlace"] | null;
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
  const filteredPosts = posts.filter((post) => {
    if (filters.category && post.category !== filters.category) {
      return false;
    }

    if (filters.date && post.dateFilter !== filters.date) {
      return false;
    }

    if (filters.time && post.timeFilter !== filters.time) {
      return false;
    }

    if (filters.departure && post.departurePlace !== filters.departure) {
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
