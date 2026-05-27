import { getPostgresPool } from "../server/db/postgres";
import {
  acceptApplicationAndCreateChatRoom,
  listChatRooms,
} from "../server/api/repository";

jest.mock("../server/db/postgres", () => ({
  getPostgresPool: jest.fn(),
}));

describe("application acceptance chat creation", () => {
  it("accepts an application and creates a room for the post author and applicant", async () => {
    const clientQuery = jest
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            application_id: "application-1",
            post_id: "carpool-1",
            applicant_id: "me",
            author_id: "author-1",
            post_title: "청도감 학원 같이 가요",
            post_type: "carpool",
            place_name: null,
            departure: "다로리 카페",
            destination: "청도명어학원",
            days: ["화", "목"],
            start_time: "16:00",
            end_time: "17:00",
            job_category: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })
      .mockResolvedValueOnce({ rowCount: 2, rows: [] })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const client = {
      query: clientQuery,
      release: jest.fn(),
    };
    const poolQuery = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [{ room_exists: true, participant_exists: true }],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "room-application-1",
            post_id: "carpool-1",
            title: "청도감 학원 같이 가요 매칭방",
            subtitle: "다로리 카페 > 청도명어학원 / 화, 목 16:00 - 17:00",
            last_message: "매칭이 시작되었습니다.",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "author-1",
            nickname: "작성자",
            real_name: null,
            phone: "010-1111-1111",
            email: null,
            avatar_url: null,
            area: "다로리",
            temperature: "36.5",
            driver_type: "driver",
            plate_number: null,
            model_name: null,
            vehicle_images: null,
          },
          {
            id: "me",
            nickname: "지원자",
            real_name: null,
            phone: "010-2222-2222",
            email: null,
            avatar_url: null,
            area: "청도",
            temperature: "37.1",
            driver_type: "non_driver",
            plate_number: null,
            model_name: null,
            vehicle_images: null,
          },
        ],
      });

    jest.mocked(getPostgresPool).mockReturnValue({
      connect: jest.fn(async () => client),
      query: poolQuery,
    } as never);

    const room = await acceptApplicationAndCreateChatRoom(
      "application-1",
      "author-1",
    );

    expect(room).toMatchObject({
      id: "room-application-1",
      postId: "carpool-1",
      participants: [{ id: "author-1" }, { id: "me" }],
    });
    expect(clientQuery).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining("insert into chat_room_participants"),
      ["room-application-1", "author-1", "me"],
    );
    expect(clientQuery).toHaveBeenCalledWith("commit");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("lists chat rooms with PostgreSQL-compatible participant aliasing", async () => {
    const poolQuery = jest.fn(async (sql: string) => {
      if (sql.includes("current_user")) {
        throw new Error('syntax error at or near "current_user"');
      }

      if (sql.includes("from chat_rooms cr")) {
        return {
          rows: [
            {
              id: "room-1",
              post_id: "carpool-1",
              title: "부릉팟",
              subtitle: "다로리 카페 > 청도역",
              last_message: "오늘 만나요",
            },
          ],
        };
      }

      if (sql.includes("from chat_room_participants crp")) {
        return {
          rows: [
            {
              id: "me",
              nickname: "지원자",
              real_name: null,
              phone: "010-2222-2222",
              email: null,
              avatar_url: null,
              area: "청도",
              temperature: "37.1",
              driver_type: "non_driver",
              plate_number: null,
              model_name: null,
              vehicle_images: null,
            },
          ],
        };
      }

      return { rows: [] };
    });

    jest.mocked(getPostgresPool).mockReturnValue({
      query: poolQuery,
    } as never);

    await expect(listChatRooms("me")).resolves.toMatchObject([
      {
        id: "room-1",
        participants: [{ id: "me" }],
      },
    ]);
  });
});
