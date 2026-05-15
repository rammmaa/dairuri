import { getPostgresPool } from "../server/db/postgres";
import { togglePostLike } from "../server/api/repository";

jest.mock("../server/db/postgres", () => ({
  getPostgresPool: jest.fn(),
}));

describe("server repository user context", () => {
  it("uses the request user id when toggling post likes", async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })
      .mockResolvedValueOnce({ rowCount: 0, rows: [] });

    jest.mocked(getPostgresPool).mockReturnValue({ query } as never);

    await togglePostLike("post-1", "author-1");

    expect(query).toHaveBeenNthCalledWith(
      1,
      "select 1 from post_likes where post_id = $1 and user_id = $2",
      ["post-1", "author-1"],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      "insert into post_likes (post_id, user_id) values ($1, $2) on conflict do nothing",
      ["post-1", "author-1"],
    );
  });
});
