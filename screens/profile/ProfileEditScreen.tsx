import { Camera, CarFront, UserRound, UserRoundCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
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
import { getMe, updateMe } from "../../services/api";
import type { DriverType, UpdateUserProfileInput } from "../../types/domain";
import { ProfileImageBottomSheet } from "./ProfileImageBottomSheet";

export type ProfileEditScreenProps = {
  onBack?: () => void;
  onSaved?: () => void;
};

export function ProfileEditScreen({ onBack, onSaved }: ProfileEditScreenProps) {
  const initialProfile = process.env.NODE_ENV === "test" ? mockMe : undefined;
  const [nickname, setNickname] = useState(initialProfile?.nickname ?? "");
  const [driverType, setDriverType] = useState<DriverType>(
    initialProfile?.driverType ?? "nonDriver",
  );
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(
    initialProfile?.avatarUrl,
  );
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [imageSheetVisible, setImageSheetVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      return undefined;
    }

    let active = true;

    getMe()
      .then((profile) => {
        if (!active) {
          return;
        }
        setNickname(profile.nickname);
        setDriverType(profile.driverType);
        setAvatarUrl(profile.avatarUrl);
        setAvatarChanged(false);
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : "프로필을 불러오지 못했어요.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    if (saving || nickname.trim().length === 0) {
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const input: UpdateUserProfileInput = {
        nickname: nickname.trim(),
        driverType,
      };
      if (avatarChanged) {
        input.avatarUrl = avatarUrl ?? null;
      }

      await updateMe(input);
      onSaved?.();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "프로필 수정에 실패했어요.",
      );
    } finally {
      setSaving(false);
    }
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
              <Camera size={18} color={colors.mintDark} strokeWidth={2.4} />
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

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            label={saving ? "저장 중" : "수정"}
            onPress={handleSave}
            disabled={saving || nickname.trim().length === 0}
            testID="profile-save"
          />
        </View>

        <ProfileImageBottomSheet
          visible={imageSheetVisible}
          onClose={() => setImageSheetVisible(false)}
          onRemove={() => {
            setAvatarUrl(undefined);
            setAvatarChanged(true);
            setImageSheetVisible(false);
          }}
          onOpenCamera={() => setImageSheetVisible(false)}
          onOpenLibrary={() => setImageSheetVisible(false)}
        />
      </View>
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
    paddingTop: 24,
    paddingBottom: 120,
    gap: 24,
  },
  avatarBlock: {
    alignSelf: "center",
    width: 178,
    height: 178,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFrame: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: colors.mintLight,
    borderWidth: 1,
    borderColor: colors.lineStrong,
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
    right: 10,
    bottom: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mintLight,
    borderWidth: 2,
    borderColor: colors.mint,
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
    minHeight: 82,
    borderRadius: 14,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray50,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 7,
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
  errorText: {
    color: colors.red,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    fontWeight: typography.weight.medium,
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
