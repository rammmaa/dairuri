import { Sparkles } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Header } from "./Header";
import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";
import { typography } from "../constants/typography";

export type ComingSoonScreenProps = {
  /** Header title shown at the top. */
  title: string;
  /** Bold one-line description of what the screen will eventually do. */
  heading: string;
  /** Optional second line shown under the heading. */
  subheading?: string;
  /** Optional Korean note line under the heading explaining the placeholder. */
  hint?: string;
  /** Back affordance handler. */
  onBack?: () => void;
  /** Test id for the root element so flow tests can target it. */
  testID?: string;
};

/**
 * Shared placeholder layout for Phase 2 features whose Figma frames are not
 * yet ready. Each Phase 2 entry point renders a thin instance of this screen
 * so the user can discover the eventual surface without the screen behaving
 * as if it works. When a real design lands, each consumer screen is replaced
 * in place; this helper does not need to change.
 */
export function ComingSoonScreen({
  title,
  heading,
  subheading,
  hint,
  onBack,
  testID,
}: ComingSoonScreenProps) {
  return (
    <View style={styles.root} testID={testID}>
      <Header title={title} showBack onBack={onBack} border />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconFrame}>
          <Sparkles size={28} color={colors.mintDark} strokeWidth={2.2} />
        </View>
        <Text style={styles.heading} accessibilityRole="header">
          {heading}
        </Text>
        {subheading ? <Text style={styles.subheading}>{subheading}</Text> : null}
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingHorizontal: spacing.screenX,
    paddingTop: 64,
    alignItems: "center",
    gap: 12,
  },
  iconFrame: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.mintLight,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    marginTop: 8,
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.lg,
    lineHeight: typography.lineHeight.lg,
    fontWeight: typography.weight.bold,
    textAlign: "center",
  },
  subheading: {
    color: colors.grayText,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
    textAlign: "center",
  },
  hint: {
    marginTop: 12,
    color: colors.mutedText,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    textAlign: "center",
    paddingHorizontal: 12,
  },
});
