import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/tokens";

interface InfoPanelScreenProps {
  title: string;
  subtitle: string;
  body: string;
}

export function InfoPanelScreen({ title, subtitle, body }: InfoPanelScreenProps) {
  return (
    <View style={styles.simpleScreen}>
      <Text style={styles.simpleTitle}>{title}</Text>
      <View style={styles.simpleCard}>
        <Text style={styles.cardTitle}>{subtitle}</Text>
        <Text style={styles.grayMeta}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  simpleScreen: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.page,
  },
  simpleTitle: {
    marginTop: 32,
    marginBottom: 20,
    fontSize: 24,
    fontWeight: "900",
    color: colors.ink,
  },
  simpleCard: {
    borderRadius: 14,
    backgroundColor: colors.background,
    padding: 20,
  },
  cardTitle: {
    color: colors.black,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 24,
    marginBottom: 10,
  },
  grayMeta: {
    color: colors.grayText,
    fontSize: 14,
    lineHeight: 22,
  },
});
