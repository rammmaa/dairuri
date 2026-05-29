import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";
import { AppButton, type AppButtonVariant } from "./AppButton";

export type ConfirmModalProps = {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: AppButtonVariant;
  onConfirm: () => void;
  onCancel?: () => void;
  testID?: string;
};

export function ConfirmModal({
  visible,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel,
  confirmVariant = "primary",
  onConfirm,
  onCancel,
  testID,
}: ConfirmModalProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay} testID={testID}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="모달 닫기"
        style={StyleSheet.absoluteFill}
        onPress={onCancel}
      />
      <View style={styles.card}>
        <View style={styles.iconFrame}>
          <Check size={26} color={colors.mintDark} strokeWidth={2.5} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
        <View style={styles.actions}>
          {cancelLabel && onCancel ? (
            <AppButton
              label={cancelLabel}
              variant="ghost"
              size="medium"
              onPress={onCancel}
              style={styles.actionButton}
            />
          ) : null}
          <AppButton
            label={confirmLabel}
            variant={confirmVariant}
            size="medium"
            onPress={onConfirm}
            style={styles.actionButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    paddingHorizontal: 24,
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    padding: spacing.screenX,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: 14,
  },
  iconFrame: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    textAlign: "center",
  },
  description: {
    color: colors.grayIcon,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    marginTop: 6,
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});
