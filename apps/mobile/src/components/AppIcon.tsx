import { ComponentProps } from "react";
import { Feather } from "@expo/vector-icons";

export type AppIconName = keyof typeof Feather.glyphMap;

type AppIconProps = Omit<ComponentProps<typeof Feather>, "name"> & {
  name: AppIconName;
};

export function AppIcon(props: AppIconProps) {
  return <Feather {...props} />;
}
