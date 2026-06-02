import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

import { typography } from "../constants/typography";
import {
  configureDefaultFontScaling,
  setFontScalingDefault,
} from "../utils/fontScaling";

const appSourceRoots = ["components", "constants", "screens"];
const appEntryFiles = ["App.tsx"];
const forbiddenFontName = ["In", "ter"].join("");
const forbiddenSystemFontPattern = /\b(Menlo|monospace|Helvetica|System|Noto_Sans)\b/;

function listSourceFiles(root: string): string[] {
  const absoluteRoot = path.join(process.cwd(), root);

  return readdirSync(absoluteRoot).flatMap((entry) => {
    const absolutePath = path.join(absoluteRoot, entry);
    const relativePath = path.relative(process.cwd(), absolutePath);
    const stat = statSync(absolutePath);

    if (stat.isDirectory()) {
      return listSourceFiles(relativePath);
    }

    if (/\.(ts|tsx)$/.test(entry)) {
      return [relativePath];
    }

    return [];
  });
}

// Match the forbidden font name only when it stands alone, not when it is a
// substring of an unrelated identifier such as expo-location's
// `distanceInterval` option. The intent of this test is to keep the "Inter"
// typeface out of the app, not to ban every English word that contains
// those five letters.
const forbiddenFontPattern = new RegExp(`\\b${forbiddenFontName}\\b`);

describe("typography tokens", () => {
  const appSourceFiles = [
    ...appSourceRoots.flatMap(listSourceFiles),
    ...appEntryFiles,
  ];

  it("uses Noto Sans for every weight family", () => {
    for (const family of Object.values(typography.family)) {
      expect(family).toContain("NotoSans");
    }
  });

  it("keeps the UI text scale compact", () => {
    expect(Object.keys(typography.size)).toEqual(["xs", "sm", "base", "lg", "title"]);
    expect(Object.keys(typography.lineHeight)).toEqual(["xs", "sm", "base", "lg", "title"]);
  });

  it("keeps the forbidden typeface out of every app source file", () => {
    for (const filePath of appSourceFiles) {
      const source = readFileSync(path.join(process.cwd(), filePath), "utf8");

      expect(source).not.toMatch(forbiddenFontPattern);
    }
  });

  it("does not reference platform or system fonts in app source", () => {
    for (const filePath of appSourceFiles) {
      const source = readFileSync(path.join(process.cwd(), filePath), "utf8");

      expect(source).not.toMatch(forbiddenSystemFontPattern);
    }
  });

  it("expresses weight through fontFamily, never fontWeight", () => {
    for (const filePath of appSourceFiles) {
      const source = readFileSync(path.join(process.cwd(), filePath), "utf8");

      expect(source).not.toMatch(/fontWeight\s*:/);
    }
  });

  it("does not hardcode text font sizes in style objects", () => {
    for (const filePath of appSourceFiles) {
      const source = readFileSync(path.join(process.cwd(), filePath), "utf8");

      expect(source).not.toMatch(/fontSize\s*:\s*\d+/);
    }
  });

  it("disables native font scaling by default for stable Android layouts", () => {
    type TextDefaultsProbe = {
      defaultProps?: Record<string, unknown>;
    };
    const textComponent = { defaultProps: { numberOfLines: 1 } };
    const inputComponent: TextDefaultsProbe = {};

    setFontScalingDefault(textComponent, false);
    setFontScalingDefault(inputComponent, false);

    expect(textComponent.defaultProps).toEqual({
      numberOfLines: 1,
      allowFontScaling: false,
    });
    expect(inputComponent.defaultProps).toEqual({
      allowFontScaling: false,
    });

    expect(() => configureDefaultFontScaling()).not.toThrow();
  });
});
