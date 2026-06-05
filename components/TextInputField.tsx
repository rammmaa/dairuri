import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from "react-native";

import { colors } from "../constants/colors";
import { typography } from "../constants/typography";

const TEXT_MAX_FONT_SIZE_MULTIPLIER = 1.08;

export type TextInputFieldProps = {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  error?: string;
  testID?: string;
} & Pick<TextInputProps, "onBlur" | "maxLength" | "autoCapitalize">;

export function TextInputField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType,
  multiline = false,
  error,
  testID,
  ...inputProps
}: TextInputFieldProps) {
  return (
    <View style={styles.root}>
      {label ? (
        <Text
          style={styles.label}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.86}
          maxFontSizeMultiplier={TEXT_MAX_FONT_SIZE_MULTIPLIER}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.gray300}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        maxFontSizeMultiplier={TEXT_MAX_FONT_SIZE_MULTIPLIER}
        testID={testID}
        style={[styles.input, multiline && styles.textarea]}
        {...inputProps}
      />
      {error ? (
        <Text
          style={styles.error}
          maxFontSizeMultiplier={TEXT_MAX_FONT_SIZE_MULTIPLIER}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  label: {
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: typography.size.sm,
    lineHeight: typography.lineHeight.sm,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: typography.size.base,
    lineHeight: typography.lineHeight.base,
  },
  textarea: {
    minHeight: 130,
    paddingTop: 14,
  },
  error: {
    color: colors.red,
    fontFamily: typography.family.regular,
    fontSize: typography.size.xs,
    lineHeight: typography.lineHeight.xs,
  },
});
