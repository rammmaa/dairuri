import { AppText, type AppTextProps } from "./AppText";

export type ScreenTitleProps = Omit<AppTextProps, "variant">;

export function ScreenTitle(props: ScreenTitleProps) {
  return <AppText variant="pageTitle" {...props} />;
}
