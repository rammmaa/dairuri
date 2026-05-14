import { useState } from "react";
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
  UserPlus,
  Users,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

import { BottomNav } from "../components/BottomNav";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { bottomNavItems, type BottomNavItem } from "../data/mapHome";

export type ChatScreenProps = {
  onSelectTab?: (item: BottomNavItem) => void;
  onOpenRoom?: (roomId: string) => void;
};

type ChatRoom = {
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

const chatRooms: ChatRoom[] = [
  {
    id: "brungpot",
    category: "ride",
    title: "부릉팟",
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
    title: "다로리 카페 같이 가요",
    initials: "다",
    participantLabel: "4명",
    latestMessage: "오늘 4시 20분 정문 앞에서 만나요!",
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

export function ChatScreen({ onSelectTab, onOpenRoom }: ChatScreenProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const handleBack = () => {
    setSelectedRoomId(null);
  };

  const openLeaveModal = () => {
    setMenuOpen(false);
    setLeaveModalOpen(true);
  };

  if (selectedRoomId === null) {
    return (
      <ChatListScreen
        rooms={chatRooms}
        onOpenRoom={(roomId) => {
          if (onOpenRoom) {
            onOpenRoom(roomId === "brungpot" ? "room-1" : "room-2");
            return;
          }

          setSelectedRoomId(roomId);
        }}
        onSelectTab={onSelectTab}
      />
    );
  }

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
              <Text style={styles.roomTitle}>부릉팟</Text>
              <Text style={styles.roomMeta}>다산 1동 → 범어 1동{"\n"}월,수 7:00~8:00</Text>
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

          <View style={styles.receivedRow}>
            <Avatar />
            <View style={styles.receivedBubbleLarge}>
              <Text style={styles.messageText}>
                안녕하세요! 저희 월요일, 수요일 7시에 어디서 만나서 출발할까요?
              </Text>
            </View>
          </View>

          <View style={styles.sentRow}>
            <View style={styles.sentBubbleSmall}>
              <Text style={styles.messageText}>안녕하세요</Text>
            </View>
            <Avatar />
          </View>

          <View style={styles.sentRow}>
            <View style={styles.sentBubbleLarge}>
              <Text style={styles.messageText}>
                다로리 카페 앞에서 6시 40분에 뵐까요?
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.inputBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="첨부 추가"
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
            placeholderTextColor="#52525B"
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
                <MenuAction icon={Users} label="매너 평가하기" />
                <MenuAction icon={ShieldAlert} label="신고하기" />
                <MenuAction icon={IdCard} label="면허증, 자동차 보험 조회하기" />
                <MenuAction icon={UserPlus} label="아는 사용자 초대하기" />
              </View>
              <View style={styles.menuSection}>
                <MenuAction icon={Search} label="검색하기" />
                <MenuAction icon={BellOff} label="알람끄기" />
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

type ChatListScreenProps = {
  rooms: ChatRoom[];
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
              <Text style={styles.listTitle}>채팅</Text>
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
              label="알바"
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
  room: ChatRoom;
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
      <Icon size={24} color="#374151" strokeWidth={2.2} />
      <Text style={styles.menuActionText}>{label}</Text>
    </Pressable>
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
  listTitle: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: typography.weight.bold,
  },
  listSubtitle: {
    marginTop: 3,
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.regular,
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
    fontWeight: typography.weight.regular,
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
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
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
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
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
    fontWeight: typography.weight.bold,
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
    fontWeight: typography.weight.bold,
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
    fontWeight: typography.weight.bold,
  },
  timeText: {
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
    fontWeight: typography.weight.regular,
  },
  unreadTime: {
    color: colors.mintDark,
    fontWeight: typography.weight.bold,
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
    fontWeight: typography.weight.bold,
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
    fontWeight: typography.weight.regular,
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
    fontWeight: typography.weight.bold,
    textAlign: "center",
  },
  header: {
    height: 176,
    paddingTop: 10,
    backgroundColor: colors.surface,
    shadowColor: "#000000",
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
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: typography.weight.regular,
    textAlign: "center",
  },
  roomMeta: {
    marginTop: 10,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.lg,
    lineHeight: 26,
    fontWeight: typography.weight.regular,
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
    borderColor: "#1F2937",
    backgroundColor: "rgba(100, 116, 139, 0.25)",
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
    fontWeight: typography.weight.regular,
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
    fontWeight: typography.weight.regular,
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
    fontWeight: typography.weight.regular,
  },
  systemCard: {
    width: 144,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.black,
    overflow: "hidden",
    backgroundColor: "#34D399",
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
    fontWeight: typography.weight.regular,
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
    fontWeight: typography.weight.regular,
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
    borderColor: "#2DD4BF",
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  recheckText: {
    color: colors.surface,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: 16,
    fontWeight: typography.weight.regular,
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
    fontWeight: typography.weight.regular,
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
    fontWeight: typography.weight.regular,
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
    backgroundColor: "#E5E7EB",
    gap: 22,
  },
  menuSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
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
    fontWeight: typography.weight.regular,
  },
  closePill: {
    height: 56,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
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
    fontWeight: typography.weight.regular,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(82, 82, 91, 0.6)",
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
    backgroundColor: "rgba(38, 38, 38, 0.85)",
  },
  confirmText: {
    color: "#F4F4F5",
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: 23,
    fontWeight: typography.weight.regular,
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
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  confirmButtonText: {
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: 22,
    fontWeight: typography.weight.regular,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.78,
  },
});
