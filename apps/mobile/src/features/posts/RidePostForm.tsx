import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createRidePostDefaults, type RideListing } from "@dairuri/shared";
import { createRidePost } from "../../services/api/dairuriApi";
import { colors } from "../../theme/tokens";

interface RidePostFormProps {
  onCreated: (ride: RideListing) => void;
}

const defaultLocation = {
  lat: 35.7001,
  lng: 128.7342,
};

export function RidePostForm({ onCreated }: RidePostFormProps) {
  const [form, setForm] = useState(createRidePostDefaults);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === "seatsTotal" ? Number(value) || 1 : value,
    }));
  };

  const submit = async () => {
    setIsSubmitting(true);
    setStatus("");

    try {
      const ride = await createRidePost({
        ...form,
        lat: defaultLocation.lat,
        lng: defaultLocation.lng,
      });
      onCreated(ride);
      setStatus("라이드 모집글이 등록됐어요.");
    } catch {
      setStatus("라이드 모집글 등록에 실패했어요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <Text style={styles.title}>라이드 모집 시작</Text>
      <TextInput
        onChangeText={(value) => updateField("title", value)}
        placeholder="모집 제목"
        style={styles.input}
        value={form.title}
      />
      <TextInput
        onChangeText={(value) => updateField("departureName", value)}
        placeholder="출발 장소"
        style={styles.input}
        value={form.departureName}
      />
      <TextInput
        onChangeText={(value) => updateField("destinationName", value)}
        placeholder="도착 장소"
        style={styles.input}
        value={form.destinationName}
      />
      <View style={styles.row}>
        <TextInput
          onChangeText={(value) => updateField("dayLabel", value)}
          placeholder="요일"
          style={[styles.input, styles.rowInput]}
          value={form.dayLabel}
        />
        <TextInput
          onChangeText={(value) => updateField("departureTime", value)}
          placeholder="출발 시간"
          style={[styles.input, styles.rowInput]}
          value={form.departureTime}
        />
      </View>
      <TextInput
        keyboardType="number-pad"
        onChangeText={(value) => updateField("seatsTotal", value)}
        placeholder="모집 인원"
        style={styles.input}
        value={String(form.seatsTotal)}
      />
      <TextInput
        multiline
        onChangeText={(value) => updateField("description", value)}
        placeholder="상세 설명"
        style={[styles.input, styles.textArea]}
        value={form.description}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="라이드 모집 등록"
        disabled={isSubmitting}
        onPress={submit}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonText}>등록</Text>
      </Pressable>
      {status ? <Text style={styles.statusText}>{status}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    minHeight: "100%",
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 112,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.headerText,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 18,
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.sheet,
    color: colors.ink,
    fontSize: 15,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowInput: {
    flex: 1,
  },
  textArea: {
    minHeight: 108,
    paddingTop: 14,
    textAlignVertical: "top",
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: colors.active,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.inkStrong,
    fontSize: 16,
    fontWeight: "800",
  },
  statusText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
    marginTop: 14,
  },
});
