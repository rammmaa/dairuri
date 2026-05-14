import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

import { typography } from "../constants/typography";

const appSourceRoots = ["components", "constants", "screens"];
const forbiddenFontName = ["In", "ter"].join("");

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

describe("typography tokens", () => {
  it("uses Noto Sans for every app text family", () => {
    expect(typography.family.body).toContain("NotoSans");
    expect(typography.family.nav).toBe(typography.family.body);

    for (const filePath of appSourceRoots.flatMap(listSourceFiles)) {
      const source = readFileSync(path.join(process.cwd(), filePath), "utf8");

      expect(source).not.toContain(forbiddenFontName);
    }
  });
});
