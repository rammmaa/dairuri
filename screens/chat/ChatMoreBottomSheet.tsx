import {
  BellOff,
  Car,
  LogOut,
  Search,
  ShieldAlert,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "../../components/BottomSheet";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

export type ChatMoreBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  onReport: () => void;
  onLeave: () => void;
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
  onReport,
  onLeave,
}: ChatMoreBottomSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      title="채팅방 더보기"
      onClose={onClose}
      testID="chat-more-bottom-sheet"
    >
      <View style={styles.group}>
        <MenuItem icon={Users} label="매너 평가하기" />
        <MenuItem
          icon={ShieldAlert}
          label="신고하기"
          onPress={onReport}
          testID="chat-more-report"
        />
        <MenuItem icon={Car} label="연락처, 자동차 번호 조회하기" />
        <MenuItem icon={UserPlus} label="아는 사용자 초대하기" />
      </View>

      <View style={styles.group}>
        <MenuItem icon={Search} label="검색하기" />
        <MenuItem icon={BellOff} label="알림끄기" />
        <MenuItem
          icon={LogOut}
          label="방 나가기"
          onPress={onLeave}
          danger
          testID="chat-more-leave"
        />
      </View>
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
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.gray50,
  },
  item: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
});
