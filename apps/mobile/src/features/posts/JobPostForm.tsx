import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import { createJobPostDefaults, type JobListing } from "@dairuri/shared";
import { createJobPost } from "../../services/api/dairuriApi";
import { colors } from "../../theme/tokens";

interface JobPostFormProps {
  onCreated: (job: JobListing) => void;
}

export function JobPostForm({ onCreated }: JobPostFormProps) {
  const [form, setForm] = useState(createJobPostDefaults);
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async () => {
    setIsSubmitting(true);
    setStatus("");

    try {
      const job = await createJobPost(form);
      onCreated(job);
      setStatus("일자리 모집글이 등록됐어요.");
    } catch {
      setStatus("일자리 모집글 등록에 실패했어요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.pageContent}>
      <Text style={styles.title}>일자리 모집 시작</Text>
      <TextInput
        onChangeText={(value) => updateField("title", value)}
        placeholder="공고 제목"
        style={styles.input}
        value={form.title}
      />
      <TextInput
        onChangeText={(value) => updateField("placeName", value)}
        placeholder="근무 장소"
        style={styles.input}
        value={form.placeName}
      />
      <TextInput
        onChangeText={(value) => updateField("payLabel", value)}
        placeholder="급여"
        style={styles.input}
        value={form.payLabel}
      />
      <TextInput
        onChangeText={(value) => updateField("scheduleLabel", value)}
        placeholder="근무 요일과 시간"
        style={styles.input}
        value={form.scheduleLabel}
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
        accessibilityLabel="일자리 모집 등록"
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
