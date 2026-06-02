import { Text, TextInput } from "react-native";

type NativeTextComponent = {
  defaultProps?: Record<string, unknown>;
};

export function setFontScalingDefault(
  Component: NativeTextComponent,
  allowFontScaling: boolean,
) {
  Component.defaultProps = {
    ...Component.defaultProps,
    allowFontScaling,
  };
}

export function configureDefaultFontScaling() {
  setFontScalingDefault(Text as unknown as NativeTextComponent, false);
  setFontScalingDefault(TextInput as unknown as NativeTextComponent, false);
}
