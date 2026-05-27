import {
  BellOff,
  LogOut,
  Search,
  ShieldAlert,
  IdCard,
  ThumbsUp,
  UserPlus,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "../../components/BottomSheet";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

export type ChatMoreBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onOpenManner?: () => void;
  onOpenCredentials?: () => void;
  onInvite?: () => void;
  onSearch?: () => void;
  onToggleMute?: () => void;
  onReport: () => void;
  onLeave: () => void;
  muted?: boolean;
};

type MenuItemProps = {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  danger?: boolean;
  testID?: string;
};

export function ChatMoreBottomSheet({
  visible,
  onClose,
  onOpenManner,
  onOpenCredentials,
  onInvite,
  onSearch,
  onToggleMute,
  onReport,
  onLeave,
  muted = false,
}: ChatMoreBottomSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      testID="chat-more-bottom-sheet"
    >
      <View style={styles.group}>
        <MenuItem icon={ThumbsUp} label="매너 평가하기" onPress={onOpenManner} />
        <MenuItem
          icon={ShieldAlert}
          label="신고하기"
          onPress={onReport}
          testID="chat-more-report"
        />
        <MenuItem
          icon={IdCard}
          label="면허증, 자동차 보험 조회하기"
          onPress={onOpenCredentials}
        />
        <MenuItem icon={UserPlus} label="아는 사용자 초대하기" onPress={onInvite} />
      </View>

      <View style={styles.group}>
        <MenuItem icon={Search} label="검색하기" onPress={onSearch} />
        <MenuItem
          icon={BellOff}
          label={muted ? "알람켜기" : "알람끄기"}
          onPress={onToggleMute}
        />
        <MenuItem
          icon={LogOut}
          label="방 나가기"
          onPress={onLeave}
          testID="chat-more-leave"
        />
      </View>
      <View style={styles.spacerCard} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="닫기"
        onPress={onClose}
        style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
      >
        <Text style={styles.closeText}>닫기</Text>
      </Pressable>
    </BottomSheet>
  );
}

function MenuItem({ icon: Icon, label, onPress, danger = false, testID }: MenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <Icon size={20} color={danger ? colors.red : colors.grayIcon} strokeWidth={2.2} />
      <Text style={[styles.itemText, danger && styles.dangerText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    gap: 8,
  },
  item: {
    minHeight: 32,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  pressed: {
    opacity: 0.72,
  },
  itemText: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.medium,
  },
  dangerText: {
    color: colors.red,
  },
  spacerCard: {
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.gray100,
  },
  closeButton: {
    alignSelf: "flex-start",
    minHeight: 28,
    justifyContent: "center",
  },
  closeText: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.regular,
  },
});
