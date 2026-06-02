import { AppText, type AppTextProps } from "./AppText";

export type ScreenTitleProps = Omit<AppTextProps, "variant">;

export function ScreenTitle({
  numberOfLines = 2,
  adjustsFontSizeToFit = true,
  minimumFontScale = 0.82,
  maxFontSizeMultiplier = 1.08,
  ...props
}: ScreenTitleProps) {
  return (
    <AppText
      variant="pageTitle"
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
    />
  );
}
