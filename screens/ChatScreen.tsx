import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowLeft,
  BellOff,
  IdCard,
  LogOut,
  MessageCircle,
  MoreVertical,
  Plus,
  Search,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  ThumbsUp,
  UserPlus,
  Users,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { BottomNav } from "../components/BottomNav";
import { ScreenTitle } from "../components/ScreenTitle";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { bottomNavItems, type BottomNavItem } from "../data/mapHome";
import { getChatRooms } from "../services/api";
import type { ChatRoom as DomainChatRoom } from "../types/domain";

export type ChatScreenProps = {
  onSelectTab?: (item: BottomNavItem) => void;
  onOpenRoom?: (roomId: string) => void;
};

type ChatListRoom = {
  id: string;
  category: "ride" | "work";
  title: string;
  initials: string;
  participantLabel: string;
  latestMessage: string;
  time: string;
  unreadCount: number;
  avatarTone: {
    background: string;
    foreground: string;
  };
};

const chatRooms: ChatListRoom[] = [
  {
    id: "brungpot",
    category: "ride",
    title: "‘청도감 학원’ 함께 다니실 사람 구해요",
    initials: "부",
    participantLabel: "김예린님 외 3명",
    latestMessage: "다로리 카페 앞에서 6시 40분에 뵐까요?",
    time: "오후 5:44",
    unreadCount: 1,
    avatarTone: {
      background: colors.mintLight,
      foreground: colors.mintDark,
    },
  },
  {
    id: "dairuri-cafe",
    category: "work",
    title: "농촌 일손과 카페 보조 도울 수 있어요",
    initials: "일",
    participantLabel: "4명",
    latestMessage: "목요일 오전 카페 보조 가능하신가요?",
    time: "오후 3:12",
    unreadCount: 3,
    avatarTone: {
      background: colors.mintLight,
      foreground: colors.mintDark,
    },
  },
  {
    id: "morning-bus",
    category: "ride",
    title: "아침 셔틀 공유방",
    initials: "셔",
    participantLabel: "12명",
    latestMessage: "1정류장 도착했어요. 곧 출발합니다.",
    time: "오전 8:45",
    unreadCount: 0,
    avatarTone: {
      background: colors.blueSoft,
      foreground: colors.blue,
    },
  },
];

type ChatFilter = "all" | "ride" | "work";
type InlineChatActionMode = "manner" | "credentials" | "invite";

const inlineRoomMessages = [
  {
    id: "received-1",
    text: "안녕하세요! 저희 월요일, 수요일 7시에 어디서 만나서 출발할까요?",
    mine: false,
  },
  {
    id: "sent-1",
    text: "안녕하세요",
    mine: true,
  },
  {
    id: "sent-2",
    text: "다로리 카페 앞에서 6시 40분에 뵐까요?",
    mine: true,
  },
];

export function ChatScreen({ onSelectTab, onOpenRoom }: ChatScreenProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [inlineAction, setInlineAction] = useState<InlineChatActionMode | null>(null);
  const [inlineMannerSaved, setInlineMannerSaved] = useState(false);
  const [inlineSearchOpen, setInlineSearchOpen] = useState(false);
  const [inlineSearchQuery, setInlineSearchQuery] = useState("");
  const [inlineMuted, setInlineMuted] = useState(false);
  const [inlineStatusMessage, setInlineStatusMessage] = useState<string | null>(null);
  const [rooms, setRooms] = useState<ChatListRoom[]>(() =>
    process.env.NODE_ENV === "test" ? chatRooms : [],
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return undefined;
    }

    let active = true;

    getChatRooms()
      .then((loadedRooms) => {
        if (active) {
          setRooms(loadedRooms.map(mapChatRoomToListItem));
        }
      })
      .catch(() => {
        if (active) {
          setRooms([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleBack = () => {
    setSelectedRoomId(null);
    setMenuOpen(false);
    setLeaveModalOpen(false);
    setInlineAction(null);
    setInlineSearchOpen(false);
    setInlineSearchQuery("");
    setInlineStatusMessage(null);
  };

  const openLeaveModal = () => {
    setMenuOpen(false);
    setLeaveModalOpen(true);
  };

  const openInlineAction = (mode: InlineChatActionMode) => {
    setMenuOpen(false);
    setInlineMannerSaved(false);
    setInlineAction(mode);
  };

  const openInlineSearch = () => {
    setMenuOpen(false);
    setInlineSearchOpen(true);
    setInlineSearchQuery("");
  };

  const toggleInlineMute = () => {
    setMenuOpen(false);
    setInlineMuted((current) => {
      const nextMuted = !current;
      setInlineStatusMessage(
        nextMuted ? "이 채팅방 알림을 껐어요." : "이 채팅방 알림을 켰어요.",
      );
      return nextMuted;
    });
  };

  if (selectedRoomId === null) {
    return (
      <ChatListScreen
        rooms={rooms}
        onOpenRoom={(roomId) => {
          if (onOpenRoom) {
            onOpenRoom(toDomainRoomId(roomId));
            return;
          }

          setSelectedRoomId(roomId);
        }}
        onSelectTab={onSelectTab}
      />
    );
  }

  const normalizedInlineSearchQuery = inlineSearchQuery.trim().toLowerCase();
  const visibleInlineMessages = normalizedInlineSearchQuery
    ? inlineRoomMessages.filter((message) =>
        message.text.toLowerCase().includes(normalizedInlineSearchQuery),
      )
    : inlineRoomMessages;
  const inlineInviteLink = `darori.chat/${selectedRoomId}`;
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId);

  return (
    <View style={styles.safeArea}>
      <View style={styles.screen} testID="chat-screen">
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="뒤로가기"
              onPress={handleBack}
              testID="chat-room-back"
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <ArrowLeft size={27} color={colors.black} strokeWidth={2.4} />
            </Pressable>

            <View style={styles.headerTitleBlock}>
              <ScreenTitle style={styles.roomTitle}>
                {selectedRoom?.title ?? "채팅"}
              </ScreenTitle>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="통화"
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.squareIcon} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="더보기"
                onPress={() => setMenuOpen(true)}
                testID="chat-room-more"
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.pressed,
                ]}
              >
                <MoreVertical size={26} color={colors.black} strokeWidth={2.4} />
              </Pressable>
            </View>
          </View>

          <View style={styles.participantRow}>
            <View style={styles.participantIcon}>
              <Users size={22} color={colors.black} strokeWidth={2} />
            </View>
            <Text style={styles.participantText}>김예린님 외 3명</Text>
          </View>
        </View>

        {inlineSearchOpen ? (
          <View style={styles.inlineSearchPanel}>
            <View style={styles.inlineSearchInputRow}>
              <Search size={18} color={colors.grayIcon} strokeWidth={2.2} />
              <TextInput
                accessibilityLabel="채팅 메시지 검색"
                placeholder="메시지 검색"
                placeholderTextColor={colors.gray400}
                value={inlineSearchQuery}
                onChangeText={setInlineSearchQuery}
                testID="chat-inline-search-input"
                style={styles.inlineSearchInput}
              />
            </View>
            {normalizedInlineSearchQuery ? (
              <Text style={styles.inlineSearchResult}>
                {visibleInlineMessages.length}개 메시지
              </Text>
            ) : null}
          </View>
        ) : null}

        <ScrollView
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.dateText}>2026년 5월 5일</Text>

          <View style={styles.systemRow}>
            <Avatar label="관리자" />
            <View style={styles.systemCard}>
              <View style={styles.systemCardTop}>
                <Text style={styles.systemTitle}>채팅이 {"\n"}시작되었어요</Text>
                <Send size={21} color={colors.black} strokeWidth={2.3} />
              </View>
              <View style={styles.systemCardBody}>
                <Text style={styles.systemBodyText}>
                  희망하던 방 개설이 완료되었어요{"\n"}
                  즐거운 라이드 쉐어링 문화를 위해, 매너 있는 채팅 부탁드려요.
                  행복한 운행되세요!
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="모임 정보 다시 확인"
                  style={({ pressed }) => [
                    styles.recheckButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.recheckText}>모임 정보 다시 확인</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {visibleInlineMessages.map((message) =>
            message.mine ? (
              <View key={message.id} style={styles.sentRow}>
                <View
                  style={
                    message.text.length < 8
                      ? styles.sentBubbleSmall
                      : styles.sentBubbleLarge
                  }
                >
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
                {message.id === "sent-1" ? <Avatar /> : null}
              </View>
            ) : (
              <View key={message.id} style={styles.receivedRow}>
                <Avatar />
                <View style={styles.receivedBubbleLarge}>
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
              </View>
            ),
          )}
        </ScrollView>

        {inlineStatusMessage ? (
          <Text style={styles.inlineStatusText}>{inlineStatusMessage}</Text>
        ) : null}

        <View style={styles.inputBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="사진 첨부"
            testID="chat-inline-attach-photo-button"
            onPress={() => setInlineStatusMessage("사진을 첨부했어요.")}
            style={({ pressed }) => [
              styles.inputIconButton,
              pressed && styles.pressed,
            ]}
          >
            <Plus size={23} color={colors.black} strokeWidth={2.2} />
          </Pressable>
          <TextInput
            accessibilityLabel="메시지 입력"
            placeholder="메시지 보내기"
            placeholderTextColor={colors.grayIcon}
            style={styles.messageInput}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="메시지 전송"
            style={({ pressed }) => [
              styles.inputIconButton,
              pressed && styles.pressed,
            ]}
          >
            <Send size={22} color={colors.black} strokeWidth={2.1} />
          </Pressable>
        </View>

        {menuOpen ? (
          <View style={styles.menuOverlay} testID="chat-room-menu">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="메뉴 닫기"
              onPress={() => setMenuOpen(false)}
              style={styles.menuBackdrop}
            />
            <View style={styles.menuPanel}>
              <View style={styles.menuSectionLarge}>
                <MenuAction
                  icon={ThumbsUp}
                  label="매너 평가하기"
                  onPress={() => openInlineAction("manner")}
                />
                <MenuAction icon={ShieldAlert} label="신고하기" />
                <MenuAction
                  icon={IdCard}
                  label="운전자 인증 확인하기"
                  onPress={() => openInlineAction("credentials")}
                />
                <MenuAction
                  icon={UserPlus}
                  label="아는 사용자 초대하기"
                  onPress={() => openInlineAction("invite")}
                />
              </View>
              <View style={styles.menuSection}>
                <MenuAction icon={Search} label="검색하기" onPress={openInlineSearch} />
                <MenuAction
                  icon={BellOff}
                  label={inlineMuted ? "알림켜기" : "알림끄기"}
                  onPress={toggleInlineMute}
                />
                <MenuAction icon={LogOut} label="방 나가기" onPress={openLeaveModal} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="닫기"
                onPress={() => setMenuOpen(false)}
                style={({ pressed }) => [
                  styles.closePill,
                  pressed && styles.pressed,
                ]}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => setMenuOpen(false)}
                style={({ pressed }) => [
                  styles.closeTextButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.closeText}>닫기</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <InlineChatActionModal
          visible={inlineAction !== null}
          mode={inlineAction}
          inviteLink={inlineInviteLink}
          mannerSaved={inlineMannerSaved}
          onRate={() => setInlineMannerSaved(true)}
          onClose={() => setInlineAction(null)}
        />

        {leaveModalOpen ? (
          <View style={styles.modalOverlay}>
            <View style={styles.confirmDialog}>
              <Text style={styles.confirmText}>
                채팅방을 나가면 채팅목록 및 대화 내용이 삭제되고 복구할 수 없어요.
                {"\n"}채팅방에서 나가시겠어요?
              </Text>
              <View style={styles.confirmActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setLeaveModalOpen(false)}
                  style={({ pressed }) => [
                    styles.cancelButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.confirmButtonText}>취소</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setLeaveModalOpen(false)}
                  style={({ pressed }) => [
                    styles.leaveButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.confirmButtonText}>네, 나갈래요.</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function toDomainRoomId(roomId: string) {
  if (roomId === "brungpot") {
    return "room-1";
  }

  if (roomId === "dairuri-cafe") {
    return "room-2";
  }

  return roomId;
}

function mapChatRoomToListItem(room: DomainChatRoom): ChatListRoom {
  const isWorkRoom = room.postId?.includes("job") ?? false;
  const participantLabel =
    room.participants.length > 0 ? `${room.participants.length}명` : "참여자 없음";

  return {
    id: room.id,
    category: isWorkRoom ? "work" : "ride",
    title: room.title,
    initials: room.title.slice(0, 1),
    participantLabel,
    latestMessage: room.lastMessage ?? "아직 메시지가 없어요",
    time: "",
    unreadCount: room.unreadCount,
    avatarTone: {
      background: isWorkRoom ? colors.mintLight : colors.blueSoft,
      foreground: isWorkRoom ? colors.mintDark : colors.blue,
    },
  };
}

type ChatListScreenProps = {
  rooms: ChatListRoom[];
  onOpenRoom: (roomId: string) => void;
  onSelectTab?: (item: BottomNavItem) => void;
};

function ChatListScreen({
  rooms,
  onOpenRoom,
  onSelectTab,
}: ChatListScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<ChatFilter>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const visibleRooms = rooms.filter((room) => {
    if (selectedFilter !== "all" && room.category !== selectedFilter) {
      return false;
    }

    if (unreadOnly && room.unreadCount === 0) {
      return false;
    }

    if (
      normalizedSearchQuery &&
      ![
        room.title,
        room.participantLabel,
        room.latestMessage,
      ].some((value) => value.toLowerCase().includes(normalizedSearchQuery))
    ) {
      return false;
    }

    return true;
  });

  return (
    <View style={styles.safeArea}>
      <View style={styles.listScreen} testID="chat-screen">
        <View style={styles.listHeader}>
          <View style={styles.listTitleRow}>
            <View>
              <ScreenTitle>채팅</ScreenTitle>
              <Text style={styles.listSubtitle}>지금 함께 이동할 대화를 확인하세요</Text>
            </View>
            <View style={styles.listHeaderIconFrame}>
              <MessageCircle size={22} color={colors.mintDark} strokeWidth={2.3} />
            </View>
          </View>

          <View style={styles.searchFilterRow}>
            <View
              accessibilityRole="search"
              accessibilityLabel="채팅방 검색"
              style={styles.searchBar}
            >
              <Search size={18} color={colors.grayText} strokeWidth={2.2} />
              <TextInput
                accessibilityLabel="채팅방 또는 메시지 검색"
                placeholder="채팅방 또는 메시지 검색"
                placeholderTextColor={colors.mutedText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={unreadOnly ? "안읽음 필터 해제" : "안읽음 필터"}
              accessibilityState={{ selected: unreadOnly }}
              onPress={() => setUnreadOnly((current) => !current)}
              testID="chat-unread-filter"
              style={({ pressed }) => [
                styles.filterButton,
                unreadOnly && styles.filterButtonSelected,
                pressed && styles.pressed,
              ]}
            >
              <SlidersHorizontal size={19} color={colors.grayIcon} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          style={styles.chatScroll}
          contentContainerStyle={styles.chatList}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.filterTabs} accessibilityRole="tablist">
            <FilterTab
              label="전체"
              selected={selectedFilter === "all"}
              onPress={() => setSelectedFilter("all")}
              testID="chat-filter-all"
            />
            <FilterTab
              label="라이드"
              selected={selectedFilter === "ride"}
              onPress={() => setSelectedFilter("ride")}
              testID="chat-filter-ride"
            />
            <FilterTab
              label="인력"
              selected={selectedFilter === "work"}
              onPress={() => setSelectedFilter("work")}
              testID="chat-filter-work"
            />
          </View>

          <Text style={styles.chatCount}>총 {visibleRooms.length}개</Text>

          {visibleRooms.length > 0 ? visibleRooms.map((room) => (
            <ChatRoomCard
              key={room.id}
              room={room}
              onPress={() => onOpenRoom(room.id)}
            />
          )) : (
            <View style={styles.emptyChatCard}>
              <Text style={styles.emptyChatText}>조건에 맞는 채팅방이 없어요</Text>
            </View>
          )}
        </ScrollView>

        <BottomNav
          items={bottomNavItems}
          selectedId="chat"
          onSelect={onSelectTab}
          testID="chat-bottom-nav"
        />
      </View>
    </View>
  );
}

type FilterTabProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  testID?: string;
};

function FilterTab({ label, selected = false, onPress, testID }: FilterTabProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.filterTab,
        selected && styles.filterTabSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.filterTabLabel,
          selected && styles.filterTabLabelSelected,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.86}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type ChatRoomCardProps = {
  room: ChatListRoom;
  onPress: () => void;
};

function ChatRoomCard({ room, onPress }: ChatRoomCardProps) {
  const hasUnread = room.unreadCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${room.title} 채팅방`}
      onPress={onPress}
      testID={`chat-room-${room.id}`}
      style={({ pressed }) => [
        styles.chatCard,
        hasUnread && styles.unreadCard,
        pressed && styles.cardPressed,
      ]}
    >
      <View
        style={[
          styles.listAvatar,
          { backgroundColor: room.avatarTone.background },
        ]}
      >
        <Text style={[styles.listAvatarText, { color: room.avatarTone.foreground }]}>
          {room.initials}
        </Text>
      </View>

      <View style={styles.chatCopy}>
        <View style={styles.chatTitleRow}>
          <Text style={styles.chatTitle} numberOfLines={1}>
            {room.title}
          </Text>
          <Text style={[styles.timeText, hasUnread && styles.unreadTime]}>
            {room.time}
          </Text>
        </View>

        <View style={styles.chatMetaRow}>
          <Text style={styles.listParticipantText}>{room.participantLabel}</Text>
          <View style={styles.metaDot} />
          <Text
            style={[styles.listMessageText, hasUnread && styles.unreadMessageText]}
            numberOfLines={1}
          >
            {room.latestMessage}
          </Text>
        </View>
      </View>

      {hasUnread ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{room.unreadCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

type AvatarProps = {
  label?: string;
};

function Avatar({ label }: AvatarProps) {
  return (
    <View style={styles.avatarBlock}>
      <View style={styles.avatar} />
      {label ? <Text style={styles.avatarLabel}>{label}</Text> : null}
    </View>
  );
}

type MenuActionProps = {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
};

function MenuAction({ icon: Icon, label, onPress }: MenuActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuAction,
        pressed && styles.pressed,
      ]}
    >
      <Icon size={24} color={colors.grayIcon} strokeWidth={2.2} />
      <Text style={styles.menuActionText}>{label}</Text>
    </Pressable>
  );
}

function InlineChatActionModal({
  visible,
  mode,
  inviteLink,
  mannerSaved,
  onRate,
  onClose,
}: {
  visible: boolean;
  mode: InlineChatActionMode | null;
  inviteLink: string;
  mannerSaved: boolean;
  onRate: () => void;
  onClose: () => void;
}) {
  if (!visible || mode === null) {
    return null;
  }

  return (
    <View style={styles.actionOverlay}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="액션 닫기"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
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
                    onPress={onRate}
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
            <Text style={styles.actionSuccessText}>인증됨</Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  listScreen: {
    flex: 1,
    backgroundColor: colors.sheet,
    overflow: "hidden",
  },
  listHeader: {
    paddingTop: 54,
    paddingHorizontal: spacing.screenX,
    paddingBottom: 18,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  listTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  listSubtitle: {
    marginTop: 3,
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  listHeaderIconFrame: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mintLight,
  },
  searchFilterRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBar: {
    flex: 1,
    minWidth: 0,
    height: spacing.inputHeight,
    paddingHorizontal: 16,
    borderRadius: spacing.inputHeight / 2,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.bg,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: colors.mutedText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    padding: 0,
  },
  filterButton: {
    width: spacing.inputHeight,
    height: spacing.inputHeight,
    borderRadius: spacing.inputHeight / 2,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  filterButtonSelected: {
    borderColor: colors.mint,
    backgroundColor: colors.mintLight,
  },
  chatScroll: {
    flex: 1,
  },
  chatList: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 14,
    paddingBottom: spacing.navHeight + 18,
    gap: 10,
  },
  filterTabs: {
    minHeight: 36,
    padding: 3,
    borderRadius: 18,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  chatCount: {
    color: colors.grayText,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  emptyChatCard: {
    minHeight: 140,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyChatText: {
    color: colors.grayText,
    fontFamily: typography.family.medium,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  filterTab: {
    flex: 1,
    minWidth: 0,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  filterTabSelected: {
    backgroundColor: colors.mintDark,
  },
  filterTabLabel: {
    width: "100%",
    color: colors.grayText,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: "center",
  },
  filterTabLabelSelected: {
    color: colors.surface,
  },
  chatCard: {
    minHeight: 92,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: spacing.cardRadius,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 2,
  },
  unreadCard: {
    borderColor: colors.mint,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  listAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  listAvatarText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  chatCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  chatTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chatTitle: {
    flex: 1,
    minWidth: 0,
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  timeText: {
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  unreadTime: {
    color: colors.mintDark,
    fontFamily: typography.family.bold,
  },
  chatMetaRow: {
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  listParticipantText: {
    color: colors.slate,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.stone,
  },
  listMessageText: {
    flex: 1,
    minWidth: 0,
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  unreadMessageText: {
    color: colors.grayIcon,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mintDark,
  },
  unreadBadgeText: {
    color: colors.surface,
    fontFamily: typography.family.bold,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    textAlign: "center",
  },
  header: {
    height: 176,
    paddingTop: 10,
    backgroundColor: colors.surface,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 4,
    zIndex: 2,
  },
  headerTopRow: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingTop: 1,
    paddingRight: 7,
  },
  roomTitle: {
    textAlign: "center",
  },
  roomMeta: {
    marginTop: 10,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.lg,
    lineHeight: 26,
    textAlign: "center",
  },
  headerActions: {
    width: 96,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    paddingRight: 8,
  },
  squareIcon: {
    width: 28,
    height: 28,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.slate,
    backgroundColor: colors.overlay,
  },
  participantRow: {
    marginTop: 12,
    marginLeft: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  participantIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  participantText: {
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  inlineSearchPanel: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
    gap: 8,
    zIndex: 1,
  },
  inlineSearchInputRow: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.gray300,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inlineSearchInput: {
    flex: 1,
    minWidth: 0,
    padding: 0,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  inlineSearchResult: {
    color: colors.grayIcon,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    minHeight: 598,
    paddingTop: 21,
    paddingHorizontal: 30,
    paddingBottom: 90,
  },
  dateText: {
    alignSelf: "center",
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  systemRow: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },
  avatarBlock: {
    width: 30,
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray300,
  },
  avatarLabel: {
    marginTop: -28,
    marginLeft: 8,
    width: 46,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: 16,
  },
  systemCard: {
    width: 144,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.black,
    overflow: "hidden",
    backgroundColor: colors.mint,
  },
  systemCardTop: {
    minHeight: 66,
    paddingTop: 5,
    paddingLeft: 8,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  systemTitle: {
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  systemCardBody: {
    minHeight: 114,
    paddingTop: 4,
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: colors.gray300,
    borderTopWidth: 0.5,
    borderTopColor: colors.black,
  },
  systemBodyText: {
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: 15,
    letterSpacing: -0.2,
  },
  recheckButton: {
    alignSelf: "center",
    minWidth: 132,
    minHeight: 28,
    marginTop: 6,
    paddingHorizontal: 11,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.mint,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  recheckText: {
    color: colors.surface,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: 16,
    letterSpacing: -0.2,
  },
  receivedRow: {
    marginTop: 56,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 20,
  },
  receivedBubbleLarge: {
    width: 240,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.gray300,
  },
  sentRow: {
    marginTop: 13,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    gap: 12,
  },
  sentBubbleSmall: {
    width: 96,
    minHeight: 32,
    paddingHorizontal: 23,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.mint,
  },
  sentBubbleLarge: {
    width: 240,
    minHeight: 32,
    marginRight: 50,
    paddingHorizontal: 17,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.mint,
  },
  messageText: {
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: 16,
  },
  inlineStatusText: {
    paddingHorizontal: 30,
    paddingBottom: 80,
    color: colors.mintDark,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  inputBar: {
    position: "absolute",
    left: 30,
    right: 30,
    bottom: 36,
    height: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  inputIconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  messageInput: {
    flex: 1,
    minWidth: 0,
    height: 32,
    paddingHorizontal: 14,
    paddingVertical: 0,
    borderRadius: 20,
    backgroundColor: colors.gray300,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: 18,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuPanel: {
    position: "absolute",
    left: 35,
    right: 35,
    bottom: 22,
    gap: 14,
  },
  menuSectionLarge: {
    minHeight: 222,
    paddingLeft: 20,
    paddingRight: 18,
    paddingTop: 20,
    paddingBottom: 10,
    borderRadius: 20,
    backgroundColor: colors.lineStrong,
    gap: 22,
  },
  menuSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 20,
    backgroundColor: colors.lineStrong,
    gap: 24,
  },
  menuAction: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  menuActionText: {
    flex: 1,
    minWidth: 0,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: 22,
  },
  closePill: {
    height: 56,
    borderRadius: 10,
    backgroundColor: colors.lineStrong,
  },
  closeTextButton: {
    alignSelf: "center",
    minHeight: 24,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: 22,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayStrong,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 6,
  },
  confirmDialog: {
    width: 282,
    minHeight: 176,
    paddingTop: 28,
    paddingHorizontal: 21,
    borderRadius: 16,
    backgroundColor: colors.overlayStrong,
  },
  confirmText: {
    color: colors.sheet,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: 23,
  },
  confirmActions: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 24,
    backgroundColor: colors.gray300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  leaveButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 24,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  confirmButtonText: {
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: 22,
    textAlign: "center",
  },
  actionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayStrong,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 7,
  },
  actionCard: {
    width: "100%",
    maxWidth: 360,
    padding: 22,
    borderRadius: 18,
    backgroundColor: colors.surface,
    gap: 14,
  },
  actionTitle: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    textAlign: "center",
  },
  actionDescription: {
    color: colors.grayIcon,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: "center",
  },
  actionSuccessText: {
    color: colors.mintDark,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
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
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  actionInfoList: {
    borderRadius: 14,
    backgroundColor: colors.gray100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  actionInfoRow: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  actionInfoLabel: {
    color: colors.grayIcon,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  actionInfoValue: {
    flex: 1,
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: "right",
  },
  inviteLink: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.mintLight,
    color: colors.mintDark,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
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
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  pressed: {
    opacity: 0.78,
  },
});
