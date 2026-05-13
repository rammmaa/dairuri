import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { ChatRoomSummary } from "@dairuri/shared";
import { fetchChatRooms } from "../../services/api/dairuriApi";
import { colors } from "../../theme/tokens";

export function ChatScreen() {
  const [rooms, setRooms] = useState<ChatRoomSummary[]>([]);
  const [status, setStatus] = useState("채팅방을 불러오는 중입니다.");

  useEffect(() => {
    let isMounted = true;

    fetchChatRooms()
      .then((nextRooms) => {
        if (!isMounted) {
          return;
        }

        setRooms(nextRooms);
        setStatus(
          nextRooms.length > 0
            ? "정기 라이딩과 일자리 조율방입니다."
            : "아직 열린 채팅방이 없습니다.",
        );
      })
      .catch(() => {
        if (isMounted) {
          setStatus("채팅방을 불러오지 못했어요.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <Text style={styles.title}>채팅</Text>
      <Text style={styles.statusText}>{status}</Text>
      {rooms.map((room) => (
        <View key={room.id} style={styles.card}>
          <Text style={styles.cardTitle}>{room.listingTitle}</Text>
          <Text style={styles.metaText}>{room.participantLabel}</Text>
          <Text style={styles.messageText}>{room.lastMessage}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    minHeight: "100%",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 112,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.headerText,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  statusText: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.sheet,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: 8,
  },
  metaText: {
    color: colors.grayText,
    fontSize: 13,
    lineHeight: 20,
  },
  messageText: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
});
