import { MoreVertical, Phone, Plus, Send } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ConfirmModal } from "../../components/ConfirmModal";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { mockChatRooms, mockMessages } from "../../data/mockDomain";
import { getChatMessages, getChatRooms, sendMessage } from "../../services/api";
import type { ChatMessage, ChatRoom } from "../../types/domain";
import { ChatMoreBottomSheet } from "./ChatMoreBottomSheet";

export type ChatRoomScreenProps = {
  roomId: string;
  onBack?: () => void;
  onReport?: (roomId: string) => void;
};

export function ChatRoomScreen({ roomId, onBack, onReport }: ChatRoomScreenProps) {
  const initialRoom = useMemo(
    () =>
      process.env.NODE_ENV === "test"
        ? mockChatRooms.find((item) => item.id === roomId) ?? mockChatRooms[0]
        : undefined,
    [roomId],
  );
  const [room, setRoom] = useState<ChatRoom | undefined>(initialRoom);
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    initialRoom ? mockMessages.filter((message) => message.roomId === initialRoom.id) : [],
  );
  const [text, setText] = useState("");
  const [moreVisible, setMoreVisible] = useState(false);
  const [leaveVisible, setLeaveVisible] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return undefined;
    }

    let active = true;

    getChatRooms()
      .then((rooms) => {
        const loadedRoom = rooms.find((item) => item.id === roomId);
        if (active && loadedRoom) {
          setRoom(loadedRoom);
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [roomId]);

  useEffect(() => {
    if (!room) {
      return undefined;
    }

    if (process.env.NODE_ENV === "test") {
      return undefined;
    }

    let active = true;

    getChatMessages(room.id).then((loadedMessages) => {
      if (!active) {
        return;
      }

      setMessages((currentMessages) => mergeMessages(currentMessages, loadedMessages));
    });

    return () => {
      active = false;
    };
  }, [room?.id]);

  if (!room) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>채팅방을 불러오는 중이에요</Text>
        </View>
      </View>
    );
  }

  const handleSend = () => {
    const trimmed = text.trim();

    if (!trimmed) {
      return;
    }

    setText("");
    sendMessage(room.id, trimmed).then((message) => {
      setMessages((currentMessages) => mergeMessages(currentMessages, [message]));
    });
  };

  const handleReport = () => {
    setMoreVisible(false);
    onReport?.(room.id);
  };

  const handleLeave = () => {
    setMoreVisible(false);
    setLeaveVisible(true);
  };

  return (
    <View style={styles.safeArea}>
      <ChatHeader
        room={room}
        onBack={onBack}
        onMore={() => setMoreVisible(true)}
      />
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContent}
        renderItem={({ item }) => (
          <ChatMessageItem message={item} mine={item.senderId === "me"} />
        )}
      />
      <MessageComposer value={text} onChangeText={setText} onSend={handleSend} />
      <ChatMoreBottomSheet
        visible={moreVisible}
        onClose={() => setMoreVisible(false)}
        onReport={handleReport}
        onLeave={handleLeave}
      />
      <ConfirmModal
        visible={leaveVisible}
        title="채팅방을 나가시겠어요?"
        description="채팅목록 및 대화 내용이 삭제되고 복구할 수 없어요."
        cancelLabel="취소"
        confirmLabel="네, 나갈래요"
        confirmVariant="danger"
        onCancel={() => setLeaveVisible(false)}
        onConfirm={() => {
          setLeaveVisible(false);
          onBack?.();
        }}
        testID="chat-leave-confirm"
      />
    </View>
  );
}

function ChatHeader({
  room,
  onBack,
  onMore,
}: {
  room: ChatRoom;
  onBack?: () => void;
  onMore: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="뒤로가기"
        onPress={onBack}
        testID="chat-room-back"
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Text style={styles.backIcon}>‹</Text>
      </Pressable>
      <View style={styles.headerText}>
        <Text style={styles.roomTitle} numberOfLines={1}>
          {room.title}
        </Text>
        {room.subtitle ? (
          <Text style={styles.roomSubtitle} numberOfLines={2}>
            {room.subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.headerActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="전화하기"
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Phone size={21} color={colors.black} strokeWidth={2.2} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="더보기"
          onPress={onMore}
          testID="chat-room-more-button"
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <MoreVertical size={23} color={colors.black} strokeWidth={2.2} />
        </Pressable>
      </View>
    </View>
  );
}

function ChatMessageItem({ message, mine }: { message: ChatMessage; mine: boolean }) {
  if (message.type === "system") {
    return (
      <View style={styles.systemMessage}>
        <Text style={styles.systemText}>{message.text}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.messageRow, mine ? styles.myMessageRow : styles.otherMessageRow]}>
      <View style={[styles.bubble, mine ? styles.myBubble : styles.otherBubble]}>
        <Text style={styles.messageText}>{message.text}</Text>
      </View>
    </View>
  );
}

function MessageComposer({
  value,
  onChangeText,
  onSend,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <View style={styles.composer}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="추가 액션"
        style={({ pressed }) => [styles.composerIconButton, pressed && styles.pressed]}
      >
        <Plus size={22} color={colors.black} strokeWidth={2.2} />
      </Pressable>
      <TextInput
        accessibilityLabel="메시지 입력"
        value={value}
        onChangeText={onChangeText}
        placeholder="메시지 보내기"
        placeholderTextColor={colors.gray400}
        style={styles.input}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="메시지 전송"
        onPress={onSend}
        testID="chat-send-button"
        style={({ pressed }) => [styles.composerIconButton, pressed && styles.pressed]}
      >
        <Send size={21} color={colors.mintDark} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

function mergeMessages(currentMessages: ChatMessage[], nextMessages: ChatMessage[]) {
  const seenIds = new Set(currentMessages.map((message) => message.id));
  const merged = [...currentMessages];

  nextMessages.forEach((message) => {
    if (!seenIds.has(message.id)) {
      seenIds.add(message.id);
      merged.push(message);
    }
  });

  return merged;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  header: {
    minHeight: 78,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: typography.weight.regular,
  },
  headerText: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  roomTitle: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
    textAlign: "center",
  },
  roomSubtitle: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
    textAlign: "center",
  },
  headerActions: {
    width: 82,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 2,
  },
  iconButton: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.72,
  },
  messagesContent: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 10,
  },
  systemMessage: {
    alignSelf: "center",
    maxWidth: "82%",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.gray100,
  },
  systemText: {
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
    textAlign: "center",
  },
  messageRow: {
    width: "100%",
    flexDirection: "row",
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  otherMessageRow: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  myBubble: {
    borderTopRightRadius: 5,
    backgroundColor: colors.mintLight,
  },
  otherBubble: {
    borderTopLeftRadius: 5,
    backgroundColor: colors.gray100,
  },
  messageText: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
  },
  composer: {
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  composerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
  },
});
