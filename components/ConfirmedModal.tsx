import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { typography } from "../constants/typography";

export type ConfirmedModalProps = {
  onHome: () => void;
  onViewRecord: () => void;
  testID?: string;
};

/**
 * Centered "기록 완료" modal shown over a dimmed parent once a sighting is
 * recorded. Matches the 2026-05-26 Figma confirmed frame: mint check, headline,
 * subtext, and two buttons - mint-outline [홈으로] and yellow [기록 보기].
 */
export function ConfirmedModal({
  onHome,
  onViewRecord,
  testID,
}: ConfirmedModalProps) {
  return (
    <View style={styles.overlay} testID={testID}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Check size={30} color={colors.mintDark} strokeWidth={2.8} />
        </View>
        <Text accessibilityRole="header" style={styles.headline}>
          기록 완료
        </Text>
        <Text style={styles.subtext}>확정이 되었습니다!{"\n"}감사합니다 :)</Text>

        <View style={styles.buttonRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="홈으로"
            onPress={onHome}
            testID="confirmed-modal-home-button"
            style={({ pressed }) => [
              styles.button,
              styles.homeButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.homeButtonText}>홈으로</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="기록 보기"
            onPress={onViewRecord}
            testID="confirmed-modal-view-record-button"
            style={({ pressed }) => [
              styles.button,
              styles.viewButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.viewButtonText}>기록 보기</Text>
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
    backgroundColor: colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: {
    marginTop: 14,
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
  },
  subtext: {
    marginTop: 8,
    color: colors.grayText,
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
    textAlign: "center",
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
  homeButton: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.mint,
  },
  homeButtonText: {
    color: colors.mintDark,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
  },
  viewButton: {
    backgroundColor: colors.yellow,
  },
  viewButtonText: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
  },
  pressed: {
    opacity: 0.86,
  },
});
