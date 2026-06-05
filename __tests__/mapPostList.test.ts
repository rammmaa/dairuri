import {
  createPagedListState,
  filterAndSortMapPosts,
} from "../data/mapPostList";
import { mapHomePosts } from "../data/mapHome";

describe("map post list helpers", () => {
  it("filters and sorts posts with shared list criteria", () => {
    const posts = filterAndSortMapPosts(mapHomePosts, {
      filters: {
        category: "work",
        days: ["화"],
        times: ["오후"],
      },
      sortMode: "latest",
    });

    expect(posts.map((post) => post.id)).toEqual(["post-2"]);

    const multiSelectedPosts = filterAndSortMapPosts(mapHomePosts, {
      filters: {
        days: ["화", "수"],
        times: ["오전"],
      },
      sortMode: "latest",
    });

    expect(multiSelectedPosts.map((post) => post.id)).toEqual([
      "post-3",
      "post-4",
    ]);

    const oldestFirst = filterAndSortMapPosts(mapHomePosts, {
      filters: {},
      sortMode: "oldest",
    });

    expect(oldestFirst.map((post) => post.createdAgo)).toEqual([
      "8시간 전",
      "4시간 전",
      "2시간 전",
      "1시간 전",
      "35분 전",
    ]);
  });

  it("exposes a paged list state with reset and next counts", () => {
    const firstPage = createPagedListState(mapHomePosts, {
      visibleCount: 2,
      pageSize: 2,
    });

    expect(firstPage.visibleItems.map((post) => post.id)).toEqual([
      "post-1",
      "post-2",
    ]);
    expect(firstPage.hasMore).toBe(true);
    expect(firstPage.nextVisibleCount).toBe(4);
    expect(firstPage.resetVisibleCount).toBe(2);

    const lastPage = createPagedListState(mapHomePosts, {
      visibleCount: 4,
      pageSize: 2,
    });

    expect(lastPage.visibleItems.map((post) => post.id)).toEqual([
      "post-1",
      "post-2",
      "post-3",
      "post-4",
    ]);
    expect(lastPage.hasMore).toBe(true);
    expect(lastPage.nextVisibleCount).toBe(5);
  });
});
