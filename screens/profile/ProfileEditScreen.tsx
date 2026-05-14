import { Camera, CarFront, UserRound, UserRoundCheck } from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "../../components/AppButton";
import { Header } from "../../components/Header";
import { TextInputField } from "../../components/TextInputField";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { typography } from "../../constants/typography";
import { mockMe } from "../../data/mockDomain";
import type { DriverType } from "../../types/domain";
import { ProfileImageBottomSheet } from "./ProfileImageBottomSheet";

export type ProfileEditScreenProps = {
  onBack?: () => void;
  onSaved?: () => void;
};

export function ProfileEditScreen({ onBack, onSaved }: ProfileEditScreenProps) {
  const [nickname, setNickname] = useState(mockMe.nickname);
  const [driverType, setDriverType] = useState<DriverType>(mockMe.driverType);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(mockMe.avatarUrl);
  const [imageSheetVisible, setImageSheetVisible] = useState(false);

  const closeImageSheet = () => {
    setImageSheetVisible(false);
  };

  const handleImageAction = (nextAvatarUrl?: string) => {
    setAvatarUrl(nextAvatarUrl);
    closeImageSheet();
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.screen}>
        <Header title="프로필" showBack onBack={onBack} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarBlock}>
            <View style={styles.avatarFrame}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <UserRound size={54} color={colors.mintDark} strokeWidth={2.1} />
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="프로필 사진 변경"
              testID="profile-avatar-edit"
              onPress={() => setImageSheetVisible(true)}
              style={({ pressed }) => [styles.avatarEditButton, pressed && styles.pressed]}
            >
              <Camera size={18} color={colors.surface} strokeWidth={2.4} />
            </Pressable>
          </View>

          <TextInputField
            label="닉네임"
            placeholder="닉네임 입력"
            value={nickname}
            onChangeText={setNickname}
            maxLength={16}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>운전 여부</Text>
            <View style={styles.driverRow}>
              <DriverOption
                label="운전자"
                icon="car"
                selected={driverType === "driver"}
                onPress={() => setDriverType("driver")}
              />
              <DriverOption
                label="비운전자"
                icon="user"
                selected={driverType === "nonDriver"}
                onPress={() => setDriverType("nonDriver")}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            label="수정"
            onPress={onSaved}
            disabled={nickname.trim().length === 0}
            testID="profile-save"
          />
        </View>
      </View>

      <ProfileImageBottomSheet
        visible={imageSheetVisible}
        onClose={closeImageSheet}
        onRemove={() => handleImageAction(undefined)}
        onOpenCamera={() => handleImageAction("camera://profile-preview")}
        onOpenLibrary={() => handleImageAction("library://profile-preview")}
      />
    </View>
  );
}

type DriverOptionProps = {
  label: string;
  icon: "car" | "user";
  selected: boolean;
  onPress: () => void;
};

function DriverOption({ label, icon, selected, onPress }: DriverOptionProps) {
  const Icon = icon === "car" ? CarFront : UserRoundCheck;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.driverOption,
        selected && styles.driverOptionSelected,
        pressed && styles.pressed,
      ]}
    >
      <Icon
        size={18}
        color={selected ? colors.mintDark : colors.yellowText}
        strokeWidth={2.3}
      />
      <Text style={styles.driverOptionText}>{label}</Text>
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
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 34,
    paddingBottom: 120,
    gap: 26,
  },
  avatarBlock: {
    alignSelf: "center",
    width: 124,
    height: 124,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFrame: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarEditButton: {
    position: "absolute",
    right: 4,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mint,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldGroup: {
    gap: 10,
  },
  label: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.bold,
  },
  driverRow: {
    flexDirection: "row",
    gap: 10,
  },
  driverOption: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  driverOptionSelected: {
    backgroundColor: colors.mintLight,
    borderColor: colors.mint,
  },
  driverOptionText: {
    color: colors.black,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    fontWeight: typography.weight.bold,
  },
  pressed: {
    opacity: 0.78,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.screenX,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
  },
});
