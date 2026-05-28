import {
  BellOff,
  IdCard,
  LogOut,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Send,
  ShieldAlert,
  ThumbsUp,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { BottomSheet } from "../../components/BottomSheet";
import { ConfirmModal } from "../../components/ConfirmModal";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { mockChatRooms, mockMessages } from "../../data/mockDomain";
import {
  getChatMessages,
  getChatRooms,
  sendImageMessage,
  sendMessage,
  submitMannerRating,
} from "../../services/api";
import { getSessionUser } from "../../services/authSession";
import type { ChatMessage, ChatRoom } from "../../types/domain";

export type ChatRoomScreenProps = {
  roomId: string;
  onBack?: () => void;
  onReport?: (roomId: string) => void;
};

type ChatActionModalMode = "manner" | "credentials" | "invite";

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
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [moreVisible, setMoreVisible] = useState(false);
  const [leaveVisible, setLeaveVisible] = useState(false);
  const [actionModal, setActionModal] = useState<ChatActionModalMode | null>(null);
  const [mannerSaved, setMannerSaved] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [muted, setMuted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [attachedPhotoUri, setAttachedPhotoUri] = useState<string | null>(null);
  const [attachedPhotoPayload, setAttachedPhotoPayload] = useState<string | null>(null);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const currentUserId = getSessionUser()?.id ?? "me";

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

  const handleSend = async () => {
    const trimmed = text.trim();
    const messageText = trimmed;

    if ((!messageText && !attachedPhotoPayload) || sending) {
      return;
    }

    setSending(true);
    setSendError(null);
    try {
      const message = attachedPhotoPayload
        ? await sendImageMessage(room.id, attachedPhotoPayload, messageText || undefined)
        : await sendMessage(room.id, messageText);
      setMessages((currentMessages) => mergeMessages(currentMessages, [message]));
      setText("");
      setAttachedPhotoUri(null);
      setAttachedPhotoPayload(null);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "메시지를 보내지 못했어요.");
    } finally {
      setSending(false);
    }
  };

  const handleReport = () => {
    setMoreVisible(false);
    onReport?.(room.id);
  };

  const handleLeave = () => {
    setMoreVisible(false);
    setLeaveVisible(true);
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleMessages = normalizedSearchQuery
    ? messages.filter((message) =>
        (message.text ?? "").toLowerCase().includes(normalizedSearchQuery),
      )
    : messages;

  const openActionModal = (mode: ChatActionModalMode) => {
    setMoreVisible(false);
    setMannerSaved(false);
    setActionModal(mode);
  };

  const openSearch = () => {
    setMoreVisible(false);
    setSearchOpen(true);
    setSearchQuery("");
  };

  const toggleMute = () => {
    setMoreVisible(false);
    setMuted((current) => {
      const nextMuted = !current;
      setStatusMessage(
        nextMuted ? "이 채팅방 알림을 껐어요." : "이 채팅방 알림을 켰어요.",
      );
      return nextMuted;
    });
  };

  const attachPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStatusMessage("사진 접근 권한이 필요해요.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.72,
      base64: true,
      allowsEditing: false,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (!asset) {
      return;
    }

    setAttachedPhotoUri(asset.uri);
    setAttachedPhotoPayload(
      asset.base64 ? `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}` : asset.uri,
    );
    setStatusMessage(null);
  };

  const submitManner = async (tag: string) => {
    try {
      const result = await submitMannerRating(room.id, [tag]);
      setMannerSaved(true);
      setStatusMessage(`매너 평가가 저장되었습니다. 현재 온도 ${result.temperature.toFixed(1)}°C`);
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "매너 평가를 저장하지 못했어요.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
      style={styles.safeArea}
      testID="chat-room-keyboard-avoiding-view"
    >
      <ChatHeader
        room={room}
        onBack={onBack}
        onMore={() => setMoreVisible(true)}
      />
      {searchOpen ? (
        <View style={styles.roomSearchPanel}>
          <View style={styles.roomSearchInputRow}>
            <Search size={18} color={colors.grayIcon} strokeWidth={2.2} />
            <TextInput
              accessibilityLabel="채팅 메시지 검색"
              placeholder="메시지 검색"
              placeholderTextColor={colors.gray400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              testID="chat-room-search-input"
              style={styles.roomSearchInput}
            />
          </View>
          {normalizedSearchQuery ? (
            <Text style={styles.roomSearchResult}>{visibleMessages.length}개 메시지</Text>
          ) : null}
        </View>
      ) : null}
      <FlatList
        data={visibleMessages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContent}
        renderItem={({ item }) => (
          <ChatMessageItem
            message={item}
            mine={item.senderId === currentUserId}
            onPreviewImage={setPreviewImageUri}
          />
        )}
      />
      {statusMessage ? <Text style={styles.roomStatusText}>{statusMessage}</Text> : null}
      {sendError ? <Text style={styles.sendErrorText}>{sendError}</Text> : null}
      <MessageComposer
        value={text}
        onChangeText={(nextText) => {
          setText(nextText);
          if (sendError) {
            setSendError(null);
          }
        }}
        onSend={handleSend}
        onAttachPhoto={() => {
          void attachPhoto();
        }}
        attachedPhotoUri={attachedPhotoUri}
        sending={sending}
      />
      <ChatMoreActionsSheet
        visible={moreVisible}
        onClose={() => setMoreVisible(false)}
        onOpenManner={() => openActionModal("manner")}
        onOpenCredentials={() => openActionModal("credentials")}
        onInvite={() => openActionModal("invite")}
        onSearch={openSearch}
        onToggleMute={toggleMute}
        onReport={handleReport}
        onLeave={handleLeave}
        muted={muted}
      />
      <ChatActionModal
        visible={actionModal !== null}
        mode={actionModal}
        room={room}
        inviteLink={`darori.chat/${room.id}`}
        mannerSaved={mannerSaved}
        onRate={(tag) => {
          void submitManner(tag);
        }}
        onClose={() => setActionModal(null)}
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
      <ChatImagePreviewModal
        imageUri={previewImageUri}
        onClose={() => setPreviewImageUri(null)}
      />
    </KeyboardAvoidingView>
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

function ChatMessageItem({
  message,
  mine,
  onPreviewImage,
}: {
  message: ChatMessage;
  mine: boolean;
  onPreviewImage: (imageUri: string) => void;
}) {
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
        {message.imageUrl ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="사진 미리보기"
            onPress={() => {
              if (message.imageUrl) {
                onPreviewImage(message.imageUrl);
              }
            }}
            testID={`chat-message-image-${message.id}`}
            style={({ pressed }) => [styles.messageImageButton, pressed && styles.pressed]}
          >
            <Image source={{ uri: message.imageUrl }} style={styles.messageImage} />
          </Pressable>
        ) : null}
        {message.text ? <Text style={styles.messageText}>{message.text}</Text> : null}
      </View>
    </View>
  );
}

function MessageComposer({
  value,
  onChangeText,
  onSend,
  onAttachPhoto,
  attachedPhotoUri,
  sending,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onAttachPhoto: () => void;
  attachedPhotoUri: string | null;
  sending: boolean;
}) {
  return (
    <View>
      {attachedPhotoUri ? (
        <View style={styles.attachmentPreview} testID="chat-attachment-preview">
          <Image source={{ uri: attachedPhotoUri }} style={styles.attachmentPreviewImage} />
          <Text style={styles.attachmentPreviewText}>사진 1장 첨부됨</Text>
        </View>
      ) : null}
      <View style={styles.composer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="사진 첨부"
          onPress={onAttachPhoto}
          testID="chat-attach-photo-button"
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
          editable={!sending}
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="메시지 전송"
          accessibilityState={{ disabled: sending }}
          disabled={sending}
          onPress={onSend}
          testID="chat-send-button"
          style={({ pressed }) => [
            styles.composerIconButton,
            sending && styles.disabledIconButton,
            pressed && styles.pressed,
          ]}
        >
          <Send
            size={21}
            color={sending ? colors.gray400 : colors.mintDark}
            strokeWidth={2.2}
          />
        </Pressable>
      </View>
    </View>
  );
}

function ChatImagePreviewModal({
  imageUri,
  onClose,
}: {
  imageUri: string | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={imageUri !== null}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.imagePreviewOverlay} testID="chat-image-preview">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            resizeMode="contain"
            style={styles.imagePreviewImage}
          />
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="사진 미리보기 닫기"
          onPress={onClose}
          style={({ pressed }) => [styles.imagePreviewCloseButton, pressed && styles.pressed]}
        >
          <X size={24} color={colors.surface} strokeWidth={2.4} />
        </Pressable>
      </View>
    </Modal>
  );
}

function ChatMoreActionsSheet({
  visible,
  onClose,
  onOpenManner,
  onOpenCredentials,
  onInvite,
  onSearch,
  onToggleMute,
  onReport,
  onLeave,
  muted,
}: {
  visible: boolean;
  onClose: () => void;
  onOpenManner: () => void;
  onOpenCredentials: () => void;
  onInvite: () => void;
  onSearch: () => void;
  onToggleMute: () => void;
  onReport: () => void;
  onLeave: () => void;
  muted: boolean;
}) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      testID="chat-more-bottom-sheet"
    >
      <View style={styles.moreGroup}>
        <ChatMoreMenuItem icon={ThumbsUp} label="매너 평가하기" onPress={onOpenManner} />
        <ChatMoreMenuItem
          icon={ShieldAlert}
          label="신고하기"
          onPress={onReport}
          testID="chat-more-report"
        />
        <ChatMoreMenuItem
          icon={IdCard}
          label="운전자 인증 확인하기"
          onPress={onOpenCredentials}
        />
        <ChatMoreMenuItem
          icon={UserPlus}
          label="아는 사용자 초대하기"
          onPress={onInvite}
        />
      </View>

      <View style={styles.moreGroup}>
        <ChatMoreMenuItem icon={Search} label="검색하기" onPress={onSearch} />
        <ChatMoreMenuItem
          icon={BellOff}
          label={muted ? "알림켜기" : "알림끄기"}
          onPress={onToggleMute}
        />
        <ChatMoreMenuItem
          icon={LogOut}
          label="방 나가기"
          onPress={onLeave}
          testID="chat-more-leave"
        />
      </View>

      <View style={styles.moreSpacer} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="닫기"
        onPress={onClose}
        style={({ pressed }) => [styles.moreCloseButton, pressed && styles.pressed]}
      >
        <Text style={styles.moreCloseText}>닫기</Text>
      </Pressable>
    </BottomSheet>
  );
}

function ChatActionModal({
  visible,
  mode,
  room,
  inviteLink,
  mannerSaved,
  onRate,
  onClose,
}: {
  visible: boolean;
  mode: ChatActionModalMode | null;
  room: ChatRoom;
  inviteLink: string;
  mannerSaved: boolean;
  onRate: (tag: string) => void;
  onClose: () => void;
}) {
  if (!visible || mode === null) {
    return null;
  }

  const verifiedDriver = room.participants.find(
    (participant) =>
      participant.driverVerification?.licenseVerified &&
      participant.driverVerification.insuranceVerified,
  );

  return (
    <View style={styles.actionOverlay}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="액션 닫기"
        style={StyleSheet.absoluteFill}
        onPress={onClose}
      />
      <View style={styles.actionCard}>
        {mode === "manner" ? (
          <>
            <Text style={styles.actionTitle}>매너 평가하기</Text>
            <Text style={styles.actionDescription}>좋았던 항목을 선택해주세요.</Text>
            {mannerSaved ? (
              <Text style={styles.actionSuccessText}>매너 평가가 저장되었습니다.</Text>
            ) : (
              <View style={styles.ratingList}>
                {[
                  "시간 약속을 잘 지켰어요",
                  "친절하게 소통했어요",
                  "안전하게 운행했어요",
                  "응답이 빨랐어요",
                ].map((label) => (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    onPress={() => onRate(label)}
                    style={({ pressed }) => [
                      styles.ratingButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.ratingButtonText}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : null}

        {mode === "credentials" ? (
          <>
            <Text style={styles.actionTitle}>운전자 인증</Text>
            <Text style={styles.actionSuccessText}>
              {verifiedDriver ? "인증됨" : "인증 정보 없음"}
            </Text>
          </>
        ) : null}

        {mode === "invite" ? (
          <>
            <Text style={styles.actionTitle}>아는 사용자 초대하기</Text>
            <Text style={styles.actionDescription}>초대 링크가 준비되었습니다.</Text>
            <Text style={styles.inviteLink}>{inviteLink}</Text>
          </>
        ) : null}

        {(mode !== "manner" || mannerSaved) ? (
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.actionConfirmButton, pressed && styles.pressed]}
          >
            <Text style={styles.actionConfirmText}>확인</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ChatMoreMenuItem({
  icon: Icon,
  label,
  onPress,
  danger = false,
  testID,
}: {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  danger?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.moreItem, pressed && styles.pressed]}
    >
      <Icon size={20} color={danger ? colors.red : colors.grayIcon} strokeWidth={2.2} />
      <Text style={[styles.moreItemText, danger && styles.dangerText]}>{label}</Text>
    </Pressable>
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
  roomSearchPanel: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
    gap: 8,
  },
  roomSearchInputRow: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roomSearchInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
  },
  roomSearchResult: {
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.medium,
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
  messageImageButton: {
    borderRadius: 10,
  },
  messageImage: {
    width: 180,
    height: 132,
    marginBottom: 6,
    borderRadius: 10,
    backgroundColor: colors.gray100,
  },
  sendErrorText: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 8,
    color: colors.red,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  roomStatusText: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 8,
    color: colors.mintDark,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
  },
  attachmentPreview: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 8,
    paddingBottom: 2,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  attachmentPreviewImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.gray100,
  },
  attachmentPreviewText: {
    color: colors.mintDark,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
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
  disabledIconButton: {
    opacity: 0.55,
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
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreviewImage: {
    width: "100%",
    height: "100%",
  },
  imagePreviewCloseButton: {
    position: "absolute",
    top: 48,
    right: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreGroup: {
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    gap: 8,
  },
  moreItem: {
    minHeight: 32,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  moreItemText: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.medium,
  },
  moreSpacer: {
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.gray100,
  },
  moreCloseButton: {
    alignSelf: "flex-start",
    minHeight: 28,
    paddingHorizontal: 0,
    justifyContent: "center",
  },
  moreCloseText: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.regular,
  },
  dangerText: {
    color: colors.red,
  },
  actionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCard: {
    width: "100%",
    maxWidth: 360,
    padding: spacing.screenX,
    borderRadius: 18,
    backgroundColor: colors.surface,
    gap: 14,
  },
  actionTitle: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
    textAlign: "center",
  },
  actionDescription: {
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
    textAlign: "center",
  },
  actionSuccessText: {
    color: colors.mintDark,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
    textAlign: "center",
  },
  ratingList: {
    gap: 8,
  },
  ratingButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingButtonSecondary: {
    backgroundColor: colors.mintLight,
    borderWidth: 1,
    borderColor: colors.mint,
  },
  ratingButtonText: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  infoList: {
    borderRadius: 14,
    backgroundColor: colors.gray100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  infoRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  infoLabel: {
    color: colors.grayIcon,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
  },
  infoValue: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
    textAlign: "right",
  },
  inviteLink: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.mintLight,
    color: colors.mintDark,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
    textAlign: "center",
  },
  actionConfirmButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  actionConfirmText: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
});
