import { HelpCircle } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { RouteChip } from "./RouteChip";

export type ConfirmRecordModalProps = {
  routeName: string;
  stopName: string;
  onCancel: () => void;
  onConfirm: () => void;
  recording?: boolean;
  testID?: string;
};

/**
 * Centered confirmation modal shown when a stop is tapped on the route/stop
 * selection screen. Matches the 2026-05-26 Figma frame: a "?" badge, the yellow
 * route chip, the "{stop} 정류장으로 기록을 완료하시겠습니까?" prompt, and a gray
 * [취소] / yellow [기록 확정] button pair. Tapping the dimmed backdrop cancels.
 */
export function ConfirmRecordModal({
  routeName,
  stopName,
  onCancel,
  onConfirm,
  recording = false,
  testID,
}: ConfirmRecordModalProps) {
  return (
    <View style={styles.overlay} testID={testID}>
      <Pressable
        style={styles.backdrop}
        accessibilityLabel="팝업 닫기"
        onPress={onCancel}
      />
      <View style={styles.card}>
        <View style={styles.badge}>
          <HelpCircle size={30} color={colors.gray400} strokeWidth={2.2} />
        </View>
        <RouteChip label={routeName} style={styles.chip} />
        <Text style={styles.prompt}>
          <Text style={styles.stopName}>{stopName}</Text> 정류장으로{"\n"}
          기록을 완료하시겠습니까?
        </Text>

        <View style={styles.buttonRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="취소"
            onPress={onCancel}
            disabled={recording}
            testID="confirm-record-cancel-button"
            style={({ pressed }) => [
              styles.button,
              styles.cancelButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="기록 확정"
            accessibilityState={{ disabled: recording }}
            onPress={onConfirm}
            disabled={recording}
            testID="confirm-record-confirm-button"
            style={({ pressed }) => [
              styles.button,
              styles.confirmButton,
              recording && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.confirmButtonText}>
              {recording ? "기록 중" : "기록 확정"}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    paddingVertical: 26,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.lineStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    marginTop: 16,
  },
  prompt: {
    marginTop: 10,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    textAlign: "center",
  },
  stopName: {
    color: colors.mintDark,
    fontFamily: typography.family.bold,
  },
  buttonRow: {
    marginTop: 22,
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: colors.gray100,
  },
  cancelButtonText: {
    color: colors.grayIcon,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
  },
  confirmButton: {
    backgroundColor: colors.yellow,
  },
  confirmButtonText: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.86,
  },
});
