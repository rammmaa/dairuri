import { Camera, Image as ImageIcon, Trash2 } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BottomSheet } from "../../components/BottomSheet";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

export type ProfileImageBottomSheetProps = {
  visible: boolean;
  onClose?: () => void;
  onRemove?: () => void;
  onOpenCamera?: () => void;
  onOpenLibrary?: () => void;
};

export function ProfileImageBottomSheet({
  visible,
  onClose,
  onRemove,
  onOpenCamera,
  onOpenLibrary,
}: ProfileImageBottomSheetProps) {
  const actions = [
    {
      label: "현재 프로필 지우기",
      icon: Trash2,
      onPress: onRemove,
      danger: true,
    },
    {
      label: "카메라 열기",
      icon: Camera,
      onPress: onOpenCamera,
      danger: false,
    },
    {
      label: "사진첩 열기",
      icon: ImageIcon,
      onPress: onOpenLibrary,
      danger: false,
    },
  ];

  return (
    <BottomSheet visible={visible} title="프로필 사진" onClose={onClose} testID="profile-image-sheet">
      <View style={styles.actionList}>
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={action.onPress}
              style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
            >
              <View style={[styles.iconFrame, action.danger && styles.dangerIconFrame]}>
                <Icon
                  size={20}
                  color={action.danger ? colors.red : colors.mintDark}
                  strokeWidth={2.3}
                />
              </View>
              <Text style={[styles.actionLabel, action.danger && styles.dangerText]}>
                {action.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  actionList: {
    gap: 6,
  },
  actionRow: {
    minHeight: 54,
    paddingHorizontal: 2,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pressed: {
    backgroundColor: colors.gray50,
  },
  iconFrame: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerIconFrame: {
    backgroundColor: colors.gray50,
  },
  actionLabel: {
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
